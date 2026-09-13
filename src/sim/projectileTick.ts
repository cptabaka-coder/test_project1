import type { EntityStore } from "./entityStore";
import { calculateDamage, rollCrit } from "./damage";
import { splashFalloff } from "./splash";
import type { Bunny, Enemy, Carrot, Projectile } from "./types";
import { resolveWeaknessMultiplier } from "./weakness";
import { killEnemy } from "./weaponFiring";
import type { Rng } from "./rng";

export interface ProjectileTickContext {
  bunny: Bunny;
  enemies: EntityStore<Enemy>;
  pickups: EntityStore<Carrot>;
  rng: Rng;
}

/**
 * Advances every active projectile: moves it, expires it at `ttlSeconds`,
 * and — for a lobbed AoE shot (the Plasma Cannon) — resolves splash damage
 * on landing, running each victim through the full damage pipeline (design
 * spec §3-5: direct hit to the closest enemy plus falloff splash to the
 * rest). Returns how many enemies the splash killed.
 */
export function tickProjectiles(
  ctx: ProjectileTickContext,
  projectiles: EntityStore<Projectile>,
  dt: number,
): number {
  let kills = 0;

  projectiles.forEachActive((p) => {
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

      ctx.enemies.forEachActive((enemy) => {
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
        const isCrit = rollCrit(ctx.bunny.stats.critChancePercent, ctx.rng);
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
        if (enemy.hp <= 0) {
          killEnemy(ctx.enemies, ctx.pickups, enemy);
          kills += 1;
        }
      }
    }

    projectiles.despawn(p);
  });

  return kills;
}
