import { describe, expect, it } from "vitest";
import { ALL_ITEMS } from "../../src/data/items";
import { SHAMBLER_RADIUS } from "../../src/data/constants";
import { KNIFE } from "../../src/data/weapons";
import { buyItem } from "../../src/sim/items";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

function spawnTarget(state: ReturnType<typeof createInitialState>) {
  return state.enemies.spawn((e) => {
    e.x = state.bunny.x + 20; // within the Knife's 60px range
    e.y = state.bunny.y;
    e.radius = SHAMBLER_RADIUS;
    e.hp = 10_000;
    e.maxHp = 10_000;
  });
}

describe("a bought Item's Stat bonus", () => {
  it("immediately increases the relevant Weapon's damage output", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.bunny.weaponSlots[0]!.weapon = KNIFE;

    const sharpeningStone = ALL_ITEMS.find((i) => i.id === "sharpening_stone")!;
    state.bunny.carrots = 100;
    state.shopOffers[0] = { kind: "item", item: sharpeningStone, price: 10 };
    buyItem(state, 0);

    const target = spawnTarget(state);
    step(state, NO_INPUT, 0);

    // Level I Knife: 6 base + 3 from Sharpening Stone (+3 Melee Damage).
    expect(10_000 - target!.hp).toBeCloseTo(6 + 3);
  });
});
