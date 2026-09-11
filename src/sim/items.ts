import { bandMultiplier } from "./bandScaling";
import type { GameState } from "./types";

/**
 * An Item's Shop price (design spec §10: "Price rises with the number
 * already owned and with the current Wave"). Reuses the same +12%/Wave
 * curve as the Band system (ADR 0003) for the Wave factor, rather than
 * inventing a second, undocumented rate; ownership scales the price
 * linearly, one extra `basePrice` per copy already owned.
 */
export function itemPrice(basePrice: number, countOwned: number, wave: number): number {
  return basePrice * (1 + countOwned) * bandMultiplier(wave);
}

/**
 * Buys the Item offer at `offerIndex` (design spec §10): applies its Stat
 * bonus immediately, deducts the price, and counts it owned. Never occupies
 * a Weapon Slot. Fails (no state change) if the offer isn't an Item or is
 * unaffordable.
 */
export function buyItem(state: GameState, offerIndex: number): boolean {
  const offer = state.shopOffers[offerIndex];
  if (!offer || offer.kind !== "item") return false;
  if (state.bunny.carrots < offer.price) return false;

  state.bunny.carrots -= offer.price;
  state.bunny.stats[offer.item.statId] += offer.item.amount;
  state.bunny.itemCounts[offer.item.id] = (state.bunny.itemCounts[offer.item.id] ?? 0) + 1;
  state.shopOffers[offerIndex] = undefined;
  return true;
}
