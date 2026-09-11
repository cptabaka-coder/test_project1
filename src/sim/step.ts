import {
  ARENA_MARGIN,
  BASE_PICKUP_RANGE,
  BUNNY_IFRAME_SECONDS,
  BUNNY_MOVE_SPEED,
  CARROT_FLY_SPEED,
  CARROT_RADIUS,
  CARROT_VALUE_ELITE,
  CARROT_VALUE_NORMAL,
  FIXED_DT,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PROJECTILE_RADIUS,
  PROJECTILE_TTL_SECONDS,
  SHAMBLER_CONTACT_DAMAGE,
  SHAMBLER_HP,
  SHAMBLER_RADIUS,
  SHAMBLER_SPEED,
} from "../data/constants";
import type { WeaponDef, WeaponFamily } from "../data/weapons";
import { calculateDamage, rollCrit } from "./damage";
import { transition } from "./state";
import { findNearestEnemy } from "./targeting";
import type { Enemy, FrameInputs, GameState, Stats } from "./types";
import { drainDueSpawns, pickSpawnPosition } from "./waveDirector";
import { STAT_GAIN_POOL } from "../data/levelUpPool";
import { levelForCarrots } from "./leveling";
import { rollLevelUpOptions } from "./levelUpRoll";
import { splashFalloff } from "./splash";
import { resolveWeaknessMultiplier } from "./weakness";
import { hitscanLineHits, meleeArcHits } from "./weapons";

function familyStatFor(family: WeaponFamily, stats: Stats): number {
  switch (family) {
    case "Melee":
      return stats.meleeDamage;
    case "Laser":
      return stats.energyDamage;
    case "Plasma":
      return stats.explosiveDamage;
  }
}

/** Despawns a dead enemy and drops its Carrot (design spec §8: 1 normal / 3 Elite). */
function killEnemy(state: GameState, enemy: Enemy): void {
  state.enemies.despawn(enemy);
  state.pickups.spawn((carrot) => {
    carrot.x = enemy.x;
    carrot.y = enemy.y;
    carrot.radius = CARROT_RADIUS;
    carrot.value = enemy.isElite ? CARROT_VALUE_ELITE : CARROT_VALUE_NORMAL;
  });
}

/** Applies one weapon's hit-list, running each enemy through the full damage
 * pipeline (design spec §3-4: Family stat -> global Damage% -> Crit -> Armor/Weakness). */
function applyWeaponHits(
  hits: Enemy[],
  baseDamage: number,
  weapon: WeaponDef,
  state: GameState,
): void {
  const familyStat = familyStatFor(weapon.family, state.bunny.stats);
  for (const enemy of hits) {
    const isCrit = rollCrit(state.bunny.stats.critChancePercent, state.rng);
    const weaknessMultiplier = resolveWeaknessMultiplier(enemy.weakness, weapon.family, weapon.id);
    const damage = calculateDamage({
      baseDamage,
      familyStat,
      globalDamagePercent: state.bunny.stats.damagePercent,
      isCrit,
      targetArmor: 0,
      weaknessMultiplier,
    });
    enemy.hp -= damage;
    if (enemy.hp <= 0) killEnemy(state, enemy);
  }
}

/**
 * Advance the simulation by exactly one fixed step — the single seam the whole
 * game is tested at (ADR 0002).
 *
 * Pure with respect to the outside world: no PixiJS, no DOM, no `Date.now()` /
 * `performance.now()`, all randomness through `state.rng`. It mutates and returns
 * `state`; the loop (issue #2) owns snapshotting for render interpolation.
 */
export function step(
  state: GameState,
  inputs: FrameInputs,
  dt: number = FIXED_DT,
): GameState {
  if (state.phase === "GameOver" || state.phase === "LevelUp") {
    state.tick += 1;
    return state;
  }

  const magnitude = Math.hypot(inputs.moveX, inputs.moveY);
  // Clamp to at most 1 rather than always normalizing, so a keyboard's
  // (1, 1) diagonal doesn't outrun a straight (1, 0) while a gamepad's
  // partial stick tilt still moves proportionally slower.
  const scale = magnitude > 1 ? 1 / magnitude : 1;

  state.bunny.x += inputs.moveX * scale * BUNNY_MOVE_SPEED * dt;
  state.bunny.y += inputs.moveY * scale * BUNNY_MOVE_SPEED * dt;

  const minX = ARENA_MARGIN + state.bunny.radius;
  const maxX = LOGICAL_WIDTH - ARENA_MARGIN - state.bunny.radius;
  if (state.bunny.x > maxX) state.bunny.x = maxX;
  else if (state.bunny.x < minX) state.bunny.x = minX;

  const minY = ARENA_MARGIN + state.bunny.radius;
  const maxY = LOGICAL_HEIGHT - ARENA_MARGIN - state.bunny.radius;
  if (state.bunny.y > maxY) state.bunny.y = maxY;
  else if (state.bunny.y < minY) state.bunny.y = minY;

  state.waveElapsedSeconds += dt;
  drainDueSpawns(state.waveSpawnSchedule, state.waveElapsedSeconds, () => {
    const spawned = state.enemies.spawn((enemy) => {
      const pos = pickSpawnPosition(state.rng);
      enemy.x = pos.x;
      enemy.y = pos.y;
      enemy.radius = SHAMBLER_RADIUS;
      enemy.hp = SHAMBLER_HP;
      enemy.maxHp = SHAMBLER_HP;
      enemy.speed = SHAMBLER_SPEED;
      enemy.contactDamage = SHAMBLER_CONTACT_DAMAGE;
      enemy.weakness = { against: "Plasma", multiplier: 1.3 }; // design spec §6
    });
    return spawned !== undefined;
  });

  state.enemies.forEachActive((enemy) => {
    const dx = state.bunny.x - enemy.x;
    const dy = state.bunny.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const ranged = enemy.ranged;
    // A ranged enemy holds its distance once in range instead of closing to melee.
    const holding = ranged !== undefined && distance <= ranged.range;

    const dash = enemy.dash;
    if (dash) {
      if (dash.activeSecondsRemaining > 0) {
        dash.activeSecondsRemaining = Math.max(0, dash.activeSecondsRemaining - dt);
      } else {
        dash.cooldownRemaining = Math.max(0, dash.cooldownRemaining - dt);
        if (dash.cooldownRemaining <= 0) {
          dash.activeSecondsRemaining = dash.durationSeconds;
          dash.cooldownRemaining = dash.cooldownSeconds;
        }
      }
    }
    const effectiveSpeed =
      dash && dash.activeSecondsRemaining > 0 ? enemy.speed * dash.speedMultiplier : enemy.speed;

    if (distance !== 0 && !holding) {
      enemy.x += (dx / distance) * effectiveSpeed * dt;
      enemy.y += (dy / distance) * effectiveSpeed * dt;
    }

    // Flying enemies ignore the stage's edge entirely (design spec §6);
    // grounded enemies can't be pushed past it.
    if (!enemy.flies) {
      const enemyMinX = enemy.radius;
      const enemyMaxX = LOGICAL_WIDTH - enemy.radius;
      if (enemy.x > enemyMaxX) enemy.x = enemyMaxX;
      else if (enemy.x < enemyMinX) enemy.x = enemyMinX;

      const enemyMinY = enemy.radius;
      const enemyMaxY = LOGICAL_HEIGHT - enemy.radius;
      if (enemy.y > enemyMaxY) enemy.y = enemyMaxY;
      else if (enemy.y < enemyMinY) enemy.y = enemyMinY;
    }

    if (ranged) {
      ranged.cooldownRemaining = Math.max(0, ranged.cooldownRemaining - dt);
      if (holding && ranged.cooldownRemaining <= 0 && distance !== 0) {
        state.projectiles.spawn((p) => {
          p.x = enemy.x;
          p.y = enemy.y;
          p.vx = (dx / distance) * ranged.projectileSpeed;
          p.vy = (dy / distance) * ranged.projectileSpeed;
          p.radius = PROJECTILE_RADIUS;
          p.damage = ranged.damage;
          p.ttlSeconds = PROJECTILE_TTL_SECONDS;
          p.lifestealPercent = enemy.lifestealPercent;
          p.owner = enemy;
        });
        ranged.cooldownRemaining = ranged.cooldownSeconds;
      }
    }
  });

  state.projectiles.forEachActive((p) => {
    // Never overshoot past a lobbed shot's landing point in one big-dt tick.
    const moveDt = Math.min(dt, Math.max(0, p.ttlSeconds));
    p.x += p.vx * moveDt;
    p.y += p.vy * moveDt;
    p.ttlSeconds -= dt;
    if (p.ttlSeconds > 0) return;

    const aoe = p.aoe;
    if (aoe) {
      let closest: Enemy | undefined;
      let closestDistance = Infinity;
      const victims: { enemy: Enemy; distance: number }[] = [];

      state.enemies.forEachActive((enemy) => {
        const ddx = enemy.x - p.x;
        const ddy = enemy.y - p.y;
        const distance = Math.hypot(ddx, ddy);
        if (distance > aoe.splashRadius) return;
        victims.push({ enemy, distance });
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = enemy;
        }
      });

      for (const { enemy, distance } of victims) {
        const isCrit = rollCrit(state.bunny.stats.critChancePercent, state.rng);
        const weaknessMultiplier = resolveWeaknessMultiplier(
          enemy.weakness,
          aoe.weaponFamily,
          aoe.weaponId,
        );
        const splashPortion = aoe.splashDamage * splashFalloff(distance, aoe.splashRadius);
        const directBonus = enemy === closest ? p.damage : 0;
        const damage = calculateDamage({
          baseDamage: splashPortion + directBonus,
          familyStat: aoe.familyStat,
          globalDamagePercent: aoe.globalDamagePercent,
          isCrit,
          targetArmor: 0,
          weaknessMultiplier,
        });
        enemy.hp -= damage;
        if (enemy.hp <= 0) killEnemy(state, enemy);
      }
    }

    state.projectiles.despawn(p);
  });

  state.pickups.forEachActive((carrot) => {
    const dx = state.bunny.x - carrot.x;
    const dy = state.bunny.y - carrot.y;
    const distance = Math.hypot(dx, dy);

    const touchRange = state.bunny.radius + carrot.radius;
    if (distance <= touchRange) {
      state.bunny.carrots += carrot.value;
      state.bunny.totalCarrotsEarned += carrot.value;
      state.pickups.despawn(carrot);
      return;
    }

    const pickupRange = BASE_PICKUP_RANGE + state.bunny.stats.pickupRange;
    if (distance <= pickupRange) {
      carrot.x += (dx / distance) * CARROT_FLY_SPEED * dt;
      carrot.y += (dy / distance) * CARROT_FLY_SPEED * dt;
    }
  });

  const newLevel = levelForCarrots(state.bunny.totalCarrotsEarned);
  if (newLevel > state.bunny.level) {
    state.bunny.level = newLevel;
    state.pendingLevelUpOptions = rollLevelUpOptions(STAT_GAIN_POOL, state.rng, 3);
    state.phase = transition(state.phase, "LevelUp");
    state.tick += 1;
    return state;
  }

  for (const slot of state.bunny.weaponSlots) {
    if (!slot.weapon) continue;

    slot.cooldownSeconds = Math.max(0, slot.cooldownSeconds - dt);
    if (slot.cooldownSeconds > 0) continue;

    const target = findNearestEnemy(state.bunny.x, state.bunny.y, state.enemies);
    if (!target) continue;

    const levelStats = slot.weapon.levels[slot.level - 1]!;
    const attacksPerSecond =
      levelStats.attacksPerSecond * (1 + state.bunny.stats.attackSpeedPercent / 100);
    slot.cooldownSeconds = 1 / attacksPerSecond;

    const facingAngle = Math.atan2(target.y - state.bunny.y, target.x - state.bunny.x);

    switch (slot.weapon.deliveryMode) {
      case "melee-arc": {
        const hits = meleeArcHits(
          state.bunny.x,
          state.bunny.y,
          facingAngle,
          levelStats.range,
          levelStats.arcDegrees ?? 360,
          state.enemies,
        );
        applyWeaponHits(hits, levelStats.damage, slot.weapon, state);
        break;
      }
      case "melee-single": {
        const dx = target.x - state.bunny.x;
        const dy = target.y - state.bunny.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= levelStats.range + target.radius) {
          applyWeaponHits([target], levelStats.damage, slot.weapon, state);
        }
        break;
      }
      case "hitscan": {
        const hits = hitscanLineHits(
          state.bunny.x,
          state.bunny.y,
          facingAngle,
          levelStats.range,
          levelStats.pierceCount ?? 1,
          state.enemies,
        );
        applyWeaponHits(hits, levelStats.damage, slot.weapon, state);
        break;
      }
      case "lobbed-aoe": {
        const dx = target.x - state.bunny.x;
        const dy = target.y - state.bunny.y;
        const distance = Math.hypot(dx, dy);
        const speed = levelStats.projectileSpeed ?? 1;
        state.projectiles.spawn((p) => {
          p.x = state.bunny.x;
          p.y = state.bunny.y;
          p.vx = distance === 0 ? 0 : (dx / distance) * speed;
          p.vy = distance === 0 ? 0 : (dy / distance) * speed;
          p.radius = PROJECTILE_RADIUS;
          p.damage = levelStats.damage;
          p.ttlSeconds = distance / speed; // detonates on arrival at the lobbed target
          p.firedBy = "bunny";
          p.aoe = {
            splashRadius: levelStats.splashRadius ?? 0,
            splashDamage: levelStats.splashDamage ?? 0,
            familyStat: familyStatFor(slot.weapon!.family, state.bunny.stats),
            globalDamagePercent: state.bunny.stats.damagePercent,
            weaponFamily: slot.weapon!.family,
            weaponId: slot.weapon!.id,
          };
        });
        break;
      }
    }
  }

  state.bunny.iframeSeconds = Math.max(0, state.bunny.iframeSeconds - dt);

  if (state.bunny.iframeSeconds <= 0) {
    state.enemies.forEachActive((enemy) => {
      if (state.bunny.iframeSeconds > 0) return; // already hit this tick
      const dx = enemy.x - state.bunny.x;
      const dy = enemy.y - state.bunny.y;
      const touchRange = enemy.radius + state.bunny.radius;
      if (dx * dx + dy * dy <= touchRange * touchRange) {
        state.bunny.hp -= enemy.contactDamage;
        state.bunny.iframeSeconds = BUNNY_IFRAME_SECONDS;
        if (enemy.lifestealPercent > 0) {
          const healed = enemy.contactDamage * (enemy.lifestealPercent / 100);
          enemy.hp = Math.min(enemy.hp + healed, enemy.maxHp);
        }
      }
    });
  }

  if (state.bunny.iframeSeconds <= 0) {
    state.projectiles.forEachActive((p) => {
      if (p.firedBy !== "enemy") return; // only enemy shots can damage the bunny
      if (state.bunny.iframeSeconds > 0) return; // already hit this tick
      const dx = p.x - state.bunny.x;
      const dy = p.y - state.bunny.y;
      const touchRange = p.radius + state.bunny.radius;
      if (dx * dx + dy * dy <= touchRange * touchRange) {
        state.bunny.hp -= p.damage;
        state.bunny.iframeSeconds = BUNNY_IFRAME_SECONDS;
        if (p.lifestealPercent > 0 && p.owner && state.enemies.isActive(p.owner)) {
          const healed = p.damage * (p.lifestealPercent / 100);
          p.owner.hp = Math.min(p.owner.hp + healed, p.owner.maxHp);
        }
        state.projectiles.despawn(p);
      }
    });
  }

  if (state.bunny.hp <= 0) {
    state.phase = transition(state.phase, "GameOver");
  }

  state.tick += 1;
  return state;
}
