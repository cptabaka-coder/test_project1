import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PROJECTILE_RADIUS,
  PROJECTILE_TTL_SECONDS,
} from "../data/constants";
import type { EntityStore } from "./entityStore";
import type { Enemy, Projectile } from "./types";

/**
 * Advances every active enemy by one tick: closes on the bunny (or holds
 * range for a ranged attacker), advances its Dash state, and fires a
 * projectile once its ranged cooldown is ready (design spec §6).
 */
export function tickEnemies(
  bunny: { x: number; y: number },
  enemies: EntityStore<Enemy>,
  projectiles: EntityStore<Projectile>,
  dt: number,
): void {
  enemies.forEachActive((enemy) => {
    const dx = bunny.x - enemy.x;
    const dy = bunny.y - enemy.y;
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
        projectiles.spawn((p) => {
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
}
