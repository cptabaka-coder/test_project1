import { describe, expect, it } from "vitest";
import { CARROT_RADIUS } from "../../src/data/constants";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

function spawnCarrotWorth(state: ReturnType<typeof createInitialState>, value: number) {
  state.pickups.spawn((c) => {
    c.x = state.bunny.x;
    c.y = state.bunny.y;
    c.radius = CARROT_RADIUS;
    c.value = value;
  });
}

describe("step", () => {
  it("pauses the Wave in LevelUp and rolls 3 options once Carrots cross the Level 2 threshold", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.phase = "Wave";
    spawnCarrotWorth(state, 8); // exactly the Level 2 threshold

    step(state, NO_INPUT, 0);

    expect(state.phase).toBe("LevelUp");
    expect(state.bunny.level).toBe(2);
    expect(state.pendingLevelUpOptions).toHaveLength(3);
  });

  it("freezes the simulation while in LevelUp — no further enemy spawns", () => {
    const state = createInitialState(1);
    state.phase = "LevelUp";
    state.waveSpawnSchedule = [0]; // due immediately, if spawning still ran

    step(state, NO_INPUT, 1);

    let activeCount = 0;
    state.enemies.forEachActive(() => {
      activeCount += 1;
    });
    expect(activeCount).toBe(0);
  });
});
