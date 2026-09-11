import { describe, expect, it } from "vitest";
import { SHAMBLER_CONTACT_DAMAGE, SHAMBLER_HP, SHAMBLER_RADIUS, SHAMBLER_SPEED } from "../../src/data/constants";
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
});
