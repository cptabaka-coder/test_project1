import { describe, expect, it } from "vitest";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("spawns Band-scaled enemies (not the flat Wave-1 Shambler stats) from Wave 2 on", () => {
    const state = createInitialState(1);
    state.wave = 2;
    state.waveSpawnSchedule = [0]; // due immediately

    step(state, NO_INPUT, 0);

    let hp: number | undefined;
    state.enemies.forEachActive((e) => {
      hp = e.hp;
    });
    // Band-scaled HP at Wave 2 (x1.12) never lands on an exact Wave-1 integer stat.
    expect(hp).not.toBe(10);
    expect(hp).toBeGreaterThan(0);
  });

  it("spawns more than one enemy type across many Wave 4 spawns", () => {
    const state = createInitialState(1);
    state.wave = 4;
    state.waveSpawnSchedule = Array.from({ length: 40 }, () => 0); // all due immediately

    step(state, NO_INPUT, 0);

    const radii = new Set<number>();
    state.enemies.forEachActive((e) => radii.add(e.radius));
    expect(radii.size).toBeGreaterThan(1);
  });
});
