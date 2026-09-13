import {
  ARENA_MARGIN,
  BUNNY_MOVE_SPEED,
  FIXED_DT,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SHAMBLER_CONTACT_DAMAGE,
  SHAMBLER_HP,
  SHAMBLER_RADIUS,
  SHAMBLER_SPEED,
  WAVE_DURATIONS_S,
} from "../data/constants";
import { GROUND_POUND_DAMAGE, GROUND_POUND_RADIUS } from "../data/boss";
import { tickBoss } from "./boss";
import { resolveBunnyDamage } from "./bunnyDamage";
import { initEnemyFromBand } from "./enemyFromBand";
import { tickEnemies } from "./enemyTick";
import { tickHazards } from "./hazardTick";
import { tickPickups } from "./pickupTick";
import { tickProjectiles } from "./projectileTick";
import { transition } from "./state";
import type { Enemy, FrameInputs, GameState } from "./types";
import { drainDueSpawns, pickSpawnPosition, pickWaveEnemyBand } from "./waveDirector";
import { STAT_GAIN_POOL } from "../data/levelUpPool";
import { levelForCarrots } from "./leveling";
import { rollLevelUpOptions } from "./levelUpRoll";
import { resetShopForWave } from "./shop";
import { waveEndPayout } from "./waveEndPayout";
import { tickWeaponFiring } from "./weaponFiring";

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
  if (
    state.phase === "GameOver" ||
    state.phase === "LevelUp" ||
    state.phase === "Victory" ||
    state.phase === "Shop"
  ) {
    state.tick += 1;
    return state;
  }

  let groundPoundLanded = false;

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
      if (state.wave === 1) {
        enemy.x = pos.x;
        enemy.y = pos.y;
        enemy.radius = SHAMBLER_RADIUS;
        enemy.hp = SHAMBLER_HP;
        enemy.maxHp = SHAMBLER_HP;
        enemy.speed = SHAMBLER_SPEED;
        enemy.contactDamage = SHAMBLER_CONTACT_DAMAGE;
        enemy.weakness = { against: "Plasma", multiplier: 1.3 }; // design spec §6
      } else {
        const band = pickWaveEnemyBand(state.wave, state.rng);
        initEnemyFromBand(enemy, band, state.wave, pos.x, pos.y);
      }
    });
    return spawned !== undefined;
  });

  const waveDuration = WAVE_DURATIONS_S[state.wave];
  if (waveDuration !== undefined && state.waveElapsedSeconds >= waveDuration) {
    // "when the timer expires the survivors are cleared and the Shop opens" (CONTEXT.md: Wave).
    const survivors: Enemy[] = [];
    state.enemies.forEachActive((e) => survivors.push(e));
    for (const e of survivors) state.enemies.despawn(e);

    state.bunny.carrots += waveEndPayout(state.wave, state.bunny.stats.harvesting);
    resetShopForWave(state);
    state.phase = transition(state.phase, "Shop");
    state.tick += 1;
    return state;
  }

  tickEnemies(state.bunny, state.enemies, state.projectiles, dt);

  if (state.boss) {
    groundPoundLanded = tickBoss(
      state.boss,
      state.bunny,
      state.enemies,
      state.sporeClouds,
      state.wave,
      state.rng,
      dt,
    );
  }

  tickHazards(state.bunny, state.sporeClouds, dt);

  state.totalKills += tickProjectiles(
    { bunny: state.bunny, enemies: state.enemies, pickups: state.pickups, rng: state.rng },
    state.projectiles,
    dt,
  );

  tickPickups(state.bunny, state.pickups, dt);

  const newLevel = levelForCarrots(state.bunny.totalCarrotsEarned);
  if (newLevel > state.bunny.level) {
    state.bunny.level = newLevel;
    state.pendingLevelUpOptions = rollLevelUpOptions(STAT_GAIN_POOL, state.rng, 3);
    state.phase = transition(state.phase, "LevelUp");
    state.tick += 1;
    return state;
  }

  state.totalKills += tickWeaponFiring(
    {
      bunny: state.bunny,
      enemies: state.enemies,
      projectiles: state.projectiles,
      pickups: state.pickups,
      rng: state.rng,
    },
    dt,
  );

  state.bunny.iframeSeconds = Math.max(0, state.bunny.iframeSeconds - dt);

  if (state.bunny.iframeSeconds <= 0) {
    state.enemies.forEachActive((enemy) => {
      if (state.bunny.iframeSeconds > 0) return; // already hit this tick
      const dx = enemy.x - state.bunny.x;
      const dy = enemy.y - state.bunny.y;
      const touchRange = enemy.radius + state.bunny.radius;
      if (dx * dx + dy * dy <= touchRange * touchRange) {
        resolveBunnyDamage(state.bunny, enemy.contactDamage, {
          entity: enemy,
          percent: enemy.lifestealPercent,
        });
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
        const lifesteal =
          p.lifestealPercent > 0 && p.owner && state.enemies.isActive(p.owner)
            ? { entity: p.owner, percent: p.lifestealPercent }
            : undefined;
        resolveBunnyDamage(state.bunny, p.damage, lifesteal);
        state.projectiles.despawn(p);
      }
    });
  }

  if (state.boss && state.bunny.iframeSeconds <= 0) {
    const boss = state.boss;
    const dx = boss.x - state.bunny.x;
    const dy = boss.y - state.bunny.y;
    const touchRange = boss.radius + state.bunny.radius;
    if (dx * dx + dy * dy <= touchRange * touchRange) {
      resolveBunnyDamage(state.bunny, boss.contactDamage);
    }
  }

  if (state.boss && groundPoundLanded && state.bunny.iframeSeconds <= 0) {
    const boss = state.boss;
    const dx = boss.x - state.bunny.x;
    const dy = boss.y - state.bunny.y;
    if (dx * dx + dy * dy <= GROUND_POUND_RADIUS * GROUND_POUND_RADIUS) {
      resolveBunnyDamage(state.bunny, GROUND_POUND_DAMAGE);
    }
  }

  if (state.bunny.hp <= 0) {
    state.phase = transition(state.phase, "GameOver");
  } else if (state.boss && state.boss.hp <= 0) {
    state.totalKills += 1;
    state.phase = transition(state.phase, "Victory");
  }

  state.tick += 1;
  return state;
}
