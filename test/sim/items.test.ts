import { describe, expect, it } from "vitest";
import { ALL_ITEMS } from "../../src/data/items";
import { buyItem, itemPrice } from "../../src/sim/items";
import { createInitialState } from "../../src/sim/types";

describe("itemPrice", () => {
  it("is the base price with none owned at Wave 1", () => {
    expect(itemPrice(10, 0, 1)).toBe(10);
  });

  it("rises with the number already owned (design spec §10)", () => {
    expect(itemPrice(10, 1, 1)).toBeCloseTo(20);
    expect(itemPrice(10, 2, 1)).toBeCloseTo(30);
  });

  it("rises with the current Wave, compounding +12%/Wave (ADR 0003)", () => {
    expect(itemPrice(10, 0, 2)).toBeCloseTo(11.2);
    expect(itemPrice(10, 0, 3)).toBeCloseTo(10 * 1.12 * 1.12);
  });
});

describe("buyItem", () => {
  it("applies the Item's Stat bonus, deducts the price, and counts it owned", () => {
    const state = createInitialState(1);
    state.bunny.carrots = 20;
    const sharpeningStone = ALL_ITEMS.find((i) => i.id === "sharpening_stone")!;
    state.shopOffers[0] = { kind: "item", item: sharpeningStone, price: 10 };

    const bought = buyItem(state, 0);

    expect(bought).toBe(true);
    expect(state.bunny.stats.meleeDamage).toBe(3);
    expect(state.bunny.carrots).toBe(10);
    expect(state.bunny.itemCounts["sharpening_stone"]).toBe(1);
    expect(state.shopOffers[0]).toBeUndefined();
  });

  it("stacks: buying the same Item repeatedly sums its bonus and its owned count", () => {
    const state = createInitialState(1);
    state.bunny.carrots = 1000;
    const sharpeningStone = ALL_ITEMS.find((i) => i.id === "sharpening_stone")!;

    for (let i = 0; i < 3; i++) {
      state.shopOffers[0] = { kind: "item", item: sharpeningStone, price: 10 };
      buyItem(state, 0);
    }

    expect(state.bunny.stats.meleeDamage).toBe(9); // 3 * 3
    expect(state.bunny.itemCounts["sharpening_stone"]).toBe(3);
  });
});
