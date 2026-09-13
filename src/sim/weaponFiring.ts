import {
  CARROT_RADIUS,
  CARROT_VALUE_ELITE,
  CARROT_VALUE_NORMAL,
  PROJECTILE_RADIUS,
} from "../data/constants";
import type { WeaponDef, WeaponFamily } from "../data/weapons";
import type { Bunny, Carrot, Enemy, Projectile, Stats } from "./types";
import type { EntityStore } from "./entityStore";
import type { Rng } from "./rng";
import { calculateDamage, rollCrit } from "./damage";
import { findNearestEnemy } from "./targeting";
import { resolveWeaknessMultiplier } from "./weakness";
import { hitscanLineHits, meleeArcHits } from "./weapons";

export interface WeaponFiringContext {
  bunny: Bunny;
  enemies: EntityStore<Enemy>;
  projectiles: EntityStore<Projectile>;
  pickups: EntityStore<Carrot>;
  rng: Rng;
}

/** Despawns a dead enemy and drops its Carrot (design spec §8: 1 normal / 3 Elite). */
export function killEnemy(
  enemies: EntityStore<Enemy>,
  pickups: EntityStore<Carrot>,
  enemy: Enemy,
): void {
  enemies.despawn(enemy);
  // Pickups vacuum the oldest at capacity rather than queue/drop (design spec §2).
  pickups.spawnVacuumingOldest((carrot) => {
    carrot.x = enemy.x;
    carrot.y = enemy.y;
    carrot.radius = CARROT_RADIUS;
    carrot.value = enemy.isElite ? CARROT_VALUE_ELITE : CARROT_VALUE_NORMAL;
  });
}

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

/** Applies one weapon's hit-list, running each enemy through the full damage
 * pipeline (design spec §3-4: Family stat -> global Damage% -> Crit -> Armor/Weakness).
 * Returns how many of those hits were lethal. */
function applyWeaponHits(
  hits: Enemy[],
  baseDamage: number,
  weapon: WeaponDef,
  ctx: WeaponFiringContext,
): number {
  let kills = 0;
  const familyStat = familyStatFor(weapon.family, ctx.bunny.stats);
  for (const enemy of hits) {
    const isCrit = rollCrit(ctx.bunny.stats.critChancePercent, ctx.rng);
    const weaknessMultiplier = resolveWeaknessMultiplier(enemy.weakness, weapon.family, weapon.id);
    const damage = calculateDamage({
      baseDamage,
      familyStat,
      globalDamagePercent: ctx.bunny.stats.damagePercent,
      isCrit,
      targetArmor: 0,
      weaknessMultiplier,
    });
    enemy.hp -= damage;
    if (enemy.hp <= 0) {
      killEnemy(ctx.enemies, ctx.pickups, enemy);
      kills += 1;
    }
  }
  return kills;
}

/**
 * Advances every Weapon Slot's cooldown and, once ready, finds the nearest
 * enemy and dispatches by the Weapon's delivery mode (design spec §5).
 * Returns how many enemies this tick's hits killed.
 */
export function tickWeaponFiring(ctx: WeaponFiringContext, dt: number): number {
  let kills = 0;

  for (const slot of ctx.bunny.weaponSlots) {
    if (!slot.weapon) continue;

    slot.cooldownSeconds = Math.max(0, slot.cooldownSeconds - dt);
    if (slot.cooldownSeconds > 0) continue;

    const target = findNearestEnemy(ctx.bunny.x, ctx.bunny.y, ctx.enemies);
    if (!target) continue;

    const levelStats = slot.weapon.levels[slot.level - 1]!;
    const attacksPerSecond =
      levelStats.attacksPerSecond * (1 + ctx.bunny.stats.attackSpeedPercent / 100);
    slot.cooldownSeconds = 1 / attacksPerSecond;

    const facingAngle = Math.atan2(target.y - ctx.bunny.y, target.x - ctx.bunny.x);

    switch (slot.weapon.deliveryMode) {
      case "melee-arc": {
        const hits = meleeArcHits(
          ctx.bunny.x,
          ctx.bunny.y,
          facingAngle,
          levelStats.range,
          levelStats.arcDegrees ?? 360,
          ctx.enemies,
        );
        kills += applyWeaponHits(hits, levelStats.damage, slot.weapon, ctx);
        break;
      }
      case "melee-single": {
        const dx = target.x - ctx.bunny.x;
        const dy = target.y - ctx.bunny.y;
        const distance = Math.hypot(dx, dy);
        if (distance <= levelStats.range + target.radius) {
          kills += applyWeaponHits([target], levelStats.damage, slot.weapon, ctx);
        }
        break;
      }
      case "hitscan": {
        const hits = hitscanLineHits(
          ctx.bunny.x,
          ctx.bunny.y,
          facingAngle,
          levelStats.range,
          levelStats.pierceCount ?? 1,
          ctx.enemies,
        );
        kills += applyWeaponHits(hits, levelStats.damage, slot.weapon, ctx);
        break;
      }
      case "lobbed-aoe": {
        const dx = target.x - ctx.bunny.x;
        const dy = target.y - ctx.bunny.y;
        const distance = Math.hypot(dx, dy);
        const speed = levelStats.projectileSpeed ?? 1;
        ctx.projectiles.spawn((p) => {
          p.x = ctx.bunny.x;
          p.y = ctx.bunny.y;
          p.vx = distance === 0 ? 0 : (dx / distance) * speed;
          p.vy = distance === 0 ? 0 : (dy / distance) * speed;
          p.radius = PROJECTILE_RADIUS;
          p.damage = levelStats.damage;
          p.ttlSeconds = distance / speed; // detonates on arrival at the lobbed target
          p.firedBy = "bunny";
          p.aoe = {
            splashRadius: levelStats.splashRadius ?? 0,
            splashDamage: levelStats.splashDamage ?? 0,
            familyStat: familyStatFor(slot.weapon!.family, ctx.bunny.stats),
            globalDamagePercent: ctx.bunny.stats.damagePercent,
            weaponFamily: slot.weapon!.family,
            weaponId: slot.weapon!.id,
          };
        });
        break;
      }
    }
  }

  return kills;
}
