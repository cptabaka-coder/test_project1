import type { EntityStore } from "./entityStore";
import type { Enemy } from "./types";

/**
 * Auto-fire targeting (design spec §5: "auto-fire at nearest, ... no player
 * aim"). Returns the closest active enemy to a point, or `undefined` if none.
 */
export function findNearestEnemy(
  x: number,
  y: number,
  enemies: EntityStore<Enemy>,
): Enemy | undefined {
  let nearest: Enemy | undefined;
  let nearestDistanceSquared = Infinity;

  enemies.forEachActive((enemy) => {
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearest = enemy;
    }
  });

  return nearest;
}
