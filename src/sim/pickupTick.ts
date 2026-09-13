import { BASE_PICKUP_RANGE, CARROT_FLY_SPEED } from "../data/constants";
import type { EntityStore } from "./entityStore";
import type { Bunny, Carrot } from "./types";

/**
 * Advances every active Carrot: collects it on contact (crediting both the
 * spendable balance and the Level's running total), or flies it toward the
 * bunny once inside Pickup Range (design spec §8).
 */
export function tickPickups(bunny: Bunny, pickups: EntityStore<Carrot>, dt: number): void {
  pickups.forEachActive((carrot) => {
    const dx = bunny.x - carrot.x;
    const dy = bunny.y - carrot.y;
    const distance = Math.hypot(dx, dy);

    const touchRange = bunny.radius + carrot.radius;
    if (distance <= touchRange) {
      bunny.carrots += carrot.value;
      bunny.totalCarrotsEarned += carrot.value;
      pickups.despawn(carrot);
      return;
    }

    const pickupRange = BASE_PICKUP_RANGE + bunny.stats.pickupRange;
    if (distance <= pickupRange) {
      carrot.x += (dx / distance) * CARROT_FLY_SPEED * dt;
      carrot.y += (dy / distance) * CARROT_FLY_SPEED * dt;
    }
  });
}
