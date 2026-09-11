import type { EntityStore } from "./entityStore";
import type { Enemy } from "./types";

/**
 * The Knife's (and any future Melee weapon's) hit detection: every active
 * enemy within `range` of the origin and inside the `arcDegrees` cone
 * centered on `facingAngle` (design spec §5).
 */
export function meleeArcHits(
  originX: number,
  originY: number,
  facingAngle: number,
  range: number,
  arcDegrees: number,
  enemies: EntityStore<Enemy>,
): Enemy[] {
  const hits: Enemy[] = [];
  const halfArc = (arcDegrees / 2) * (Math.PI / 180);

  enemies.forEachActive((enemy) => {
    const dx = enemy.x - originX;
    const dy = enemy.y - originY;
    const distance = Math.hypot(dx, dy);
    if (distance > range + enemy.radius) return;

    const angleToEnemy = Math.atan2(dy, dx);
    let angleDelta = angleToEnemy - facingAngle;
    angleDelta = Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta)); // normalize to [-pi, pi]
    if (Math.abs(angleDelta) > halfArc) return;

    hits.push(enemy);
  });

  return hits;
}

/**
 * The Laser Pistol's hit detection: a straight, instant line from the origin
 * along `facingAngle`, out to `range`. Hits the closest `pierceCount` active
 * enemies whose circle the line passes through (design spec §5: "hitscan,
 * pierces 2").
 */
export function hitscanLineHits(
  originX: number,
  originY: number,
  facingAngle: number,
  range: number,
  pierceCount: number,
  enemies: EntityStore<Enemy>,
): Enemy[] {
  const ux = Math.cos(facingAngle);
  const uy = Math.sin(facingAngle);
  const candidates: { enemy: Enemy; along: number }[] = [];

  enemies.forEachActive((enemy) => {
    const dx = enemy.x - originX;
    const dy = enemy.y - originY;
    const along = dx * ux + dy * uy; // distance along the ray
    if (along < 0 || along > range) return;

    const perpendicular = Math.abs(dx * uy - dy * ux); // distance from the ray
    if (perpendicular > enemy.radius) return;

    candidates.push({ enemy, along });
  });

  candidates.sort((a, b) => a.along - b.along);
  return candidates.slice(0, pierceCount).map((c) => c.enemy);
}
