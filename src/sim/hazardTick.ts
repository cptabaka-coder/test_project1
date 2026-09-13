import type { EntityStore } from "./entityStore";
import type { SporeCloud } from "./types";

/**
 * Advances every active Spore Cloud's lifetime, despawning it on expiry, and
 * damages the bunny each tick it stands in one (design spec §6, Phase 2) —
 * continuous, unlike Contact Damage, so it is not gated by the iframe window.
 */
export function tickHazards(
  bunny: { x: number; y: number; radius: number; hp: number },
  sporeClouds: EntityStore<SporeCloud>,
  dt: number,
): void {
  sporeClouds.forEachActive((cloud) => {
    cloud.secondsRemaining -= dt;
    if (cloud.secondsRemaining <= 0) {
      sporeClouds.despawn(cloud);
      return;
    }
    const cdx = bunny.x - cloud.x;
    const cdy = bunny.y - cloud.y;
    const touchRange = cloud.radius + bunny.radius;
    if (cdx * cdx + cdy * cdy <= touchRange * touchRange) {
      bunny.hp -= cloud.damagePerSecond * dt; // continuous, not iframe-gated
    }
  });
}
