import { describe, expect, it } from "vitest";
import { CARROT_VALUE_ELITE, CARROT_VALUE_NORMAL, SHAMBLER_RADIUS } from "../../src/data/constants";
import { KNIFE } from "../../src/data/weapons";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("drops a Carrot where a normal enemy dies to the bunny's Weapon", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.bunny.weaponSlots[0]!.weapon = KNIFE;

    state.enemies.spawn((e) => {
      e.x = state.bunny.x + 20; // within the Knife's 60px range
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 1; // one hit kills it
      e.maxHp = 1;
    });

    step(state, NO_INPUT, 0);

    const drops: { x: number; y: number; value: number }[] = [];
    state.pickups.forEachActive((c) => drops.push({ x: c.x, y: c.y, value: c.value }));

    expect(drops).toHaveLength(1);
    expect(drops[0]!.value).toBe(CARROT_VALUE_NORMAL);
    expect(drops[0]!.x).toBeCloseTo(state.bunny.x + 20);
    expect(drops[0]!.y).toBeCloseTo(state.bunny.y);
  });

  it("drops CARROT_VALUE_ELITE Carrots where an Elite dies", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.bunny.weaponSlots[0]!.weapon = KNIFE;

    state.enemies.spawn((e) => {
      e.x = state.bunny.x + 20;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 1;
      e.maxHp = 1;
      e.isElite = true;
    });

    step(state, NO_INPUT, 0);

    const drops: { value: number }[] = [];
    state.pickups.forEachActive((c) => drops.push({ value: c.value }));

    expect(drops).toHaveLength(1);
    expect(drops[0]!.value).toBe(CARROT_VALUE_ELITE);
  });
});
