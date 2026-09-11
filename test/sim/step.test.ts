import { describe, expect, it } from "vitest";
import {
  ARENA_MARGIN,
  BUNNY_MOVE_SPEED,
  BUNNY_RADIUS,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
} from "../../src/data/constants";

import { createInitialState } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("createInitialState", () => {
  it("places the bunny at the arena's center", () => {
    const state = createInitialState(1);

    expect(state.bunny.x).toBeCloseTo(LOGICAL_WIDTH / 2);
    expect(state.bunny.y).toBeCloseTo(LOGICAL_HEIGHT / 2);
  });
});

describe("step", () => {
  it("moves the bunny in a straight line at the base move speed", () => {
    const state = createInitialState(1);
    const startX = state.bunny.x;

    step(state, { moveX: 1, moveY: 0 }, 0.5);

    expect(state.bunny.x).toBeCloseTo(startX + BUNNY_MOVE_SPEED * 0.5);
    expect(state.bunny.y).toBeCloseTo(LOGICAL_HEIGHT / 2);
  });

  it("caps diagonal movement to the base move speed instead of moving faster", () => {
    const state = createInitialState(1);
    const startX = state.bunny.x;
    const startY = state.bunny.y;

    step(state, { moveX: 1, moveY: 1 }, 0.5);

    const dx = state.bunny.x - startX;
    const dy = state.bunny.y - startY;
    const distance = Math.hypot(dx, dy);

    expect(distance).toBeCloseTo(BUNNY_MOVE_SPEED * 0.5);
  });

  it("stops the bunny at the east wall instead of letting it leave the arena", () => {
    const state = createInitialState(1);
    state.bunny.x = LOGICAL_WIDTH - ARENA_MARGIN - BUNNY_RADIUS - 1;

    step(state, { moveX: 1, moveY: 0 }, 1); // 100px of travel, far past the wall

    expect(state.bunny.x).toBeCloseTo(LOGICAL_WIDTH - ARENA_MARGIN - BUNNY_RADIUS);
  });

  it("stops the bunny at the west wall instead of letting it leave the arena", () => {
    const state = createInitialState(1);
    state.bunny.x = ARENA_MARGIN + BUNNY_RADIUS + 1;

    step(state, { moveX: -1, moveY: 0 }, 1); // 100px of travel, far past the wall

    expect(state.bunny.x).toBeCloseTo(ARENA_MARGIN + BUNNY_RADIUS);
  });

  it("stops the bunny at the north wall instead of letting it leave the arena", () => {
    const state = createInitialState(1);
    state.bunny.y = ARENA_MARGIN + BUNNY_RADIUS + 1;

    step(state, { moveX: 0, moveY: -1 }, 1); // 100px of travel, far past the wall

    expect(state.bunny.y).toBeCloseTo(ARENA_MARGIN + BUNNY_RADIUS);
  });

  it("stops the bunny at the south wall instead of letting it leave the arena", () => {
    const state = createInitialState(1);
    state.bunny.y = LOGICAL_HEIGHT - ARENA_MARGIN - BUNNY_RADIUS - 1;

    step(state, { moveX: 0, moveY: 1 }, 1); // 100px of travel, far past the wall

    expect(state.bunny.y).toBeCloseTo(LOGICAL_HEIGHT - ARENA_MARGIN - BUNNY_RADIUS);
  });
});
