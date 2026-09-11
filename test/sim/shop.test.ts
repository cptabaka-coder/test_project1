import { describe, expect, it } from "vitest";
import { ALL_ITEMS } from "../../src/data/items";
import { ALL_WEAPONS, KNIFE, WOODEN_STAKE } from "../../src/data/weapons";
import {
  maxOfferLevelForWave,
  rerollCost,
  sellBackValue,
  buyWeapon,
  generateShopOffers,
  rerollShopOffers,
  resetShopForWave,
  sellWeapon,
  toggleLock,
} from "../../src/sim/shop";
import { Rng } from "../../src/sim/rng";
import { createInitialState } from "../../src/sim/types";

describe("rerollCost", () => {
  it("costs 1 for the first Reroll of the Wave", () => {
    expect(rerollCost(0)).toBe(1);
  });

  it("costs +1 per Reroll already used this Wave (design spec §9)", () => {
    expect(rerollCost(1)).toBe(2);
    expect(rerollCost(2)).toBe(3);
  });
});

describe("maxOfferLevelForWave", () => {
  it("caps offers at Level I before Wave 3 (design spec §9)", () => {
    expect(maxOfferLevelForWave(1)).toBe(1);
    expect(maxOfferLevelForWave(2)).toBe(1);
  });

  it("unlocks Level II offers from Wave 3", () => {
    expect(maxOfferLevelForWave(3)).toBe(2);
    expect(maxOfferLevelForWave(4)).toBe(2);
  });

  it("unlocks Level III offers from Wave 5", () => {
    expect(maxOfferLevelForWave(5)).toBe(3);
  });
});

describe("sellBackValue", () => {
  it("is 50% of the purchase price (design spec §9)", () => {
    expect(sellBackValue(10)).toBe(5);
    expect(sellBackValue(15)).toBe(7.5);
  });
});

describe("buyWeapon", () => {
  it("fills an empty Slot, deducts the price, and doesn't touch the Level", () => {
    const state = createInitialState(1);
    state.bunny.carrots = 20;
    state.bunny.totalCarrotsEarned = 20;
    state.shopOffers[0] = { kind: "weapon", weapon: WOODEN_STAKE, level: 1, price: 14 };

    const bought = buyWeapon(state, 0);

    expect(bought).toBe(true);
    expect(state.bunny.carrots).toBe(6); // 20 - 14
    expect(state.bunny.totalCarrotsEarned).toBe(20); // unaffected — still the Level's XP
    const slot = state.bunny.weaponSlots.find((s) => s.weapon === WOODEN_STAKE);
    expect(slot?.purchasePrice).toBe(14);
    expect(state.shopOffers[0]).toBeUndefined(); // the offer is consumed
  });

  it("fails without enough Carrots, leaving state unchanged", () => {
    const state = createInitialState(1);
    state.bunny.carrots = 5;
    state.shopOffers[0] = { kind: "weapon", weapon: WOODEN_STAKE, level: 1, price: 14 };

    const bought = buyWeapon(state, 0);

    expect(bought).toBe(false);
    expect(state.bunny.carrots).toBe(5);
    expect(state.shopOffers[0]).toBeDefined();
  });

  it("fails once all 6 Weapon Slots are taken by other Weapons", () => {
    const state = createInitialState(1);
    state.bunny.carrots = 1000;
    for (const slot of state.bunny.weaponSlots) {
      slot.weapon = KNIFE; // fill every Slot with something else
    }
    state.shopOffers[0] = { kind: "weapon", weapon: WOODEN_STAKE, level: 1, price: 14 };

    const bought = buyWeapon(state, 0);

    expect(bought).toBe(false);
  });
});

describe("sellWeapon", () => {
  it("refunds 50% of the purchase price and empties the Slot", () => {
    const state = createInitialState(1);
    state.bunny.carrots = 0;
    const slotIndex = 1;
    state.bunny.weaponSlots[slotIndex] = {
      weapon: WOODEN_STAKE,
      level: 1,
      cooldownSeconds: 0,
      purchasePrice: 14,
    };

    sellWeapon(state, slotIndex);

    expect(state.bunny.carrots).toBe(7); // 50% of 14
    expect(state.bunny.weaponSlots[slotIndex]!.weapon).toBeUndefined();
  });
});

describe("generateShopOffers", () => {
  it("fills 4 offer slots, each a real Weapon or Item at a price", () => {
    const offers = generateShopOffers(new Rng(1), 1, {});

    expect(offers).toHaveLength(4);
    for (const offer of offers) {
      expect(offer.price).toBeGreaterThan(0);
      if (offer.kind === "weapon") {
        expect(ALL_WEAPONS).toContain(offer.weapon);
        expect(offer.level).toBe(1);
      } else {
        expect(ALL_ITEMS).toContain(offer.item);
      }
    }
  });
});

describe("resetShopForWave", () => {
  it("rolls fresh offers, clears Locks, and resets the Reroll cost to 1", () => {
    const state = createInitialState(1);
    state.shopLocked = [true, true, true, true];
    state.shopRerollUses = 3;

    resetShopForWave(state);

    expect(state.shopOffers).toHaveLength(4);
    expect(state.shopOffers.every((offer) => offer !== undefined)).toBe(true);
    expect(state.shopLocked).toEqual([false, false, false, false]);
    expect(state.shopRerollUses).toBe(0);
    expect(rerollCost(state.shopRerollUses)).toBe(1);
  });
});

describe("rerollShopOffers", () => {
  it("charges the current Reroll cost and advances it for next time", () => {
    const state = createInitialState(1);
    resetShopForWave(state);
    state.bunny.carrots = 10;

    const rerolled = rerollShopOffers(state);

    expect(rerolled).toBe(true);
    expect(state.bunny.carrots).toBe(9); // first Reroll costs 1
    expect(state.shopRerollUses).toBe(1);
  });

  it("keeps a Locked offer's Weapon through the Reroll", () => {
    const state = createInitialState(1);
    resetShopForWave(state);
    state.bunny.carrots = 10;
    state.shopLocked[0] = true;
    const lockedOffer = state.shopOffers[0];

    rerollShopOffers(state);

    expect(state.shopOffers[0]).toEqual(lockedOffer);
  });

  it("fails without enough Carrots, leaving the offers and cost unchanged", () => {
    const state = createInitialState(1);
    resetShopForWave(state);
    state.bunny.carrots = 0;
    const before = [...state.shopOffers];

    const rerolled = rerollShopOffers(state);

    expect(rerolled).toBe(false);
    expect(state.shopOffers).toEqual(before);
    expect(state.shopRerollUses).toBe(0);
  });
});

describe("toggleLock", () => {
  it("flips a slot's Locked state on, then off again", () => {
    const state = createInitialState(1);

    toggleLock(state, 2);
    expect(state.shopLocked[2]).toBe(true);

    toggleLock(state, 2);
    expect(state.shopLocked[2]).toBe(false);
  });
});
