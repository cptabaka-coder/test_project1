import { SHOP_OFFER_COUNT } from "../data/constants";
import { ALL_ITEMS } from "../data/items";
import { ALL_WEAPONS } from "../data/weapons";
import { itemPrice } from "./items";
import type { Rng } from "./rng";
import type { GameState, ShopOffer } from "./types";

/**
 * The between-Wave Shop (design spec §9). Rerolling costs 1 Carrot the
 * first time, +1 per use since, resetting each Wave.
 */
export function rerollCost(usesThisWave: number): number {
  return usesThisWave + 1;
}

/** Level gating (design spec §9): Level II offers from Wave 3, Level III from Wave 5. */
export function maxOfferLevelForWave(wave: number): number {
  if (wave >= 5) return 3;
  if (wave >= 3) return 2;
  return 1;
}

const SELL_BACK_FRACTION = 0.5;

/** Selling an owned Weapon/Item refunds 50% of what it cost (design spec §9). */
export function sellBackValue(purchasePrice: number): number {
  return purchasePrice * SELL_BACK_FRACTION;
}

/**
 * Buys the offer at `offerIndex`: fills an empty Weapon Slot, or upgrades the
 * Slot already holding that Weapon (design spec §9). Fails (returns false,
 * no state change) if the offer is empty, unaffordable, or — for a new
 * Weapon — every Slot is already taken (the 6-Slot cap).
 */
export function buyWeapon(state: GameState, offerIndex: number): boolean {
  const offer = state.shopOffers[offerIndex];
  if (!offer || offer.kind !== "weapon") return false;
  if (state.bunny.carrots < offer.price) return false;

  const owned = state.bunny.weaponSlots.find((slot) => slot.weapon === offer.weapon);
  const empty = state.bunny.weaponSlots.find((slot) => !slot.weapon);
  const target = owned ?? empty;
  if (!target) return false; // 6-Slot cap, and this Weapon isn't already owned

  state.bunny.carrots -= offer.price;
  target.weapon = offer.weapon;
  target.level = offer.level;
  target.purchasePrice = offer.price;
  state.shopOffers[offerIndex] = undefined;
  return true;
}

/** Flips whether an offer is Locked (design spec §9: survives the next Reroll). */
export function toggleLock(state: GameState, offerIndex: number): void {
  state.shopLocked[offerIndex] = !state.shopLocked[offerIndex];
}

/** Sells the Weapon in `slotIndex`, refunding `sellBackValue` and emptying the Slot. */
export function sellWeapon(state: GameState, slotIndex: number): void {
  const slot = state.bunny.weaponSlots[slotIndex];
  if (!slot?.weapon) return;

  state.bunny.carrots += sellBackValue(slot.purchasePrice);
  slot.weapon = undefined;
  slot.level = 1;
  slot.purchasePrice = 0;
  slot.cooldownSeconds = 0;
}

/**
 * Rolls the Shop's 4 offers (design spec §9-10), mixing Weapons and Items
 * 50/50. A Weapon offer's Level is capped both by `wave`'s gating and by
 * how many Levels that Weapon actually has data for (only Level I is
 * populated so far, issues #6/#8), so every rolled offer is always playable.
 */
export function generateShopOffers(
  rng: Rng,
  wave: number,
  itemCounts: Record<string, number>,
): ShopOffer[] {
  const gatedLevel = maxOfferLevelForWave(wave);

  return Array.from({ length: SHOP_OFFER_COUNT }, (): ShopOffer => {
    if (rng.next() < 0.5) {
      const weapon = ALL_WEAPONS[rng.int(ALL_WEAPONS.length)]!;
      const level = Math.min(gatedLevel, weapon.levels.length);
      return { kind: "weapon", weapon, level, price: weapon.basePrice * level };
    }

    const item = ALL_ITEMS[rng.int(ALL_ITEMS.length)]!;
    const price = itemPrice(item.basePrice, itemCounts[item.id] ?? 0, wave);
    return { kind: "item", item, price };
  });
}

/** Opens/refreshes the Shop for the current Wave (design spec §9): fresh
 * offers, every Lock cleared, Reroll cost back down to 1. */
export function resetShopForWave(state: GameState): void {
  state.shopOffers = generateShopOffers(state.rng, state.wave, state.bunny.itemCounts);
  state.shopLocked = state.shopLocked.map(() => false);
  state.shopRerollUses = 0;
}

/**
 * Rerolls every unlocked offer (design spec §9): charges the current Reroll
 * cost and advances it. Fails (no state change) if the bunny can't afford it.
 */
export function rerollShopOffers(state: GameState): boolean {
  const cost = rerollCost(state.shopRerollUses);
  if (state.bunny.carrots < cost) return false;

  state.bunny.carrots -= cost;
  state.shopRerollUses += 1;

  const freshOffers = generateShopOffers(state.rng, state.wave, state.bunny.itemCounts);
  state.shopOffers = state.shopOffers.map((offer, i) =>
    state.shopLocked[i] ? offer : freshOffers[i],
  );
  return true;
}
