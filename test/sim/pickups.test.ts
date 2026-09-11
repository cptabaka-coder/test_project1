import { describe, expect, it } from "vitest";
import { BASE_PICKUP_RANGE, CARROT_RADIUS } from "../../src/data/constants";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

function spawnCarrot(state: ReturnType<typeof createInitialState>, x: number, y: number) {
  return state.pickups.spawn((c) => {
    c.x = x;
    c.y = y;
    c.radius = CARROT_RADIUS;
    c.value = 1;
  });
}

describe("step", () => {
  it("leaves a Carrot outside Pickup Range where it lies", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const startX = state.bunny.x - (BASE_PICKUP_RANGE + 50); // well outside range
    const startY = state.bunny.y;
    spawnCarrot(state, startX, startY);

    step(state, NO_INPUT, 1);

    let seen: { x: number; y: number } | undefined;
    state.pickups.forEachActive((c) => {
      seen = { x: c.x, y: c.y };
    });
    expect(seen?.x).toBeCloseTo(startX);
    expect(seen?.y).toBeCloseTo(startY);
  });

  it("flies a Carrot toward the bunny once within Pickup Range", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const startX = state.bunny.x - (BASE_PICKUP_RANGE - 10); // just inside range
    const startY = state.bunny.y;
    spawnCarrot(state, startX, startY);

    step(state, NO_INPUT, 0.1);

    let seen: { x: number } | undefined;
    state.pickups.forEachActive((c) => {
      seen = { x: c.x };
    });
    expect(seen?.x).toBeGreaterThan(startX); // moved toward the bunny (east)
  });

  it("collects a Carrot on contact, adding its value to the bunny's total", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    spawnCarrot(state, state.bunny.x, state.bunny.y); // already overlapping

    step(state, NO_INPUT, 0);

    expect(state.bunny.carrots).toBe(1);
    let activeCount = 0;
    state.pickups.forEachActive(() => {
      activeCount += 1;
    });
    expect(activeCount).toBe(0);
  });
});
