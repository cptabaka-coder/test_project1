import { describe, expect, it } from "vitest";
import {
  ARENA_MARGIN,
  BUNNY_RADIUS,
  LOGICAL_WIDTH,
  SHAMBLER_CONTACT_DAMAGE,
  SHAMBLER_HP,
  SHAMBLER_RADIUS,
  SHAMBLER_SPEED,
} from "../../src/data/constants";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("moves an enemy toward the bunny at the enemy's own speed", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = []; // isolate chase movement from wave spawning
    const startX = state.bunny.x - 100;
    const startY = state.bunny.y;
    state.enemies.spawn((e) => {
      e.x = startX;
      e.y = startY;
      e.radius = SHAMBLER_RADIUS;
      e.hp = SHAMBLER_HP;
      e.speed = SHAMBLER_SPEED;
      e.contactDamage = SHAMBLER_CONTACT_DAMAGE;
    });

    step(state, NO_INPUT, 0.5);

    let seen: { x: number; y: number } | undefined;
    state.enemies.forEachActive((e) => {
      seen = { x: e.x, y: e.y };
    });

    // Straight line toward the bunny (same y, bunny is to the east): moves
    // +x by speed*dt, y unchanged.
    expect(seen?.x).toBeCloseTo(startX + SHAMBLER_SPEED * 0.5);
    expect(seen?.y).toBeCloseTo(startY);
  });

  it("stops a grounded enemy at the stage edge instead of letting it fly off", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.bunny.x = LOGICAL_WIDTH - ARENA_MARGIN - BUNNY_RADIUS; // already at the bunny's own clamp, won't move
    state.enemies.spawn((e) => {
      e.x = state.bunny.x - 5; // just west of the bunny, heading east
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = SHAMBLER_HP;
      e.speed = SHAMBLER_SPEED;
      e.flies = false;
    });

    step(state, NO_INPUT, 100); // huge dt: would massively overshoot the stage

    let seen: { x: number } | undefined;
    state.enemies.forEachActive((e) => {
      seen = { x: e.x };
    });
    expect(seen?.x).toBeCloseTo(LOGICAL_WIDTH - SHAMBLER_RADIUS);
  });

  it("lets a flying enemy pass the stage edge, ignoring walls/cover (design spec §6)", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.bunny.x = LOGICAL_WIDTH - ARENA_MARGIN - BUNNY_RADIUS;
    state.enemies.spawn((e) => {
      e.x = state.bunny.x - 5;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = SHAMBLER_HP;
      e.speed = SHAMBLER_SPEED;
      e.flies = true;
    });

    step(state, NO_INPUT, 100);

    let seen: { x: number } | undefined;
    state.enemies.forEachActive((e) => {
      seen = { x: e.x };
    });
    expect(seen!.x).toBeGreaterThan(LOGICAL_WIDTH);
  });
});
