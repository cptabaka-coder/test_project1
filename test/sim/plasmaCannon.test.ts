import { describe, expect, it } from "vitest";
import { SHAMBLER_RADIUS } from "../../src/data/constants";
import { PLASMA_CANNON } from "../../src/data/weapons";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

function equipPlasmaCannon(state: ReturnType<typeof createInitialState>) {
  state.bunny.weaponSlots[0]!.weapon = PLASMA_CANNON;
}

describe("step", () => {
  it("Plasma Cannon lobs a shot that detonates on the nearest enemy, dealing direct damage", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    equipPlasmaCannon(state);

    const target = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 50;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 1000;
      e.maxHp = 1000;
    });

    step(state, NO_INPUT, 0); // fires — the shot is now in flight
    step(state, NO_INPUT, 5); // dt exceeds any plausible travel time — it lands and detonates

    // Level I: 22 direct + 12 splash at the epicenter (distance 0 -> full falloff).
    expect(1000 - target!.hp).toBeCloseTo(22 + 12);
  });

  it("splash damage falls off with distance from the impact, and stops entirely past the radius", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    equipPlasmaCannon(state);

    // The primary target the shot is aimed at (the direct hit, at the epicenter).
    state.enemies.spawn((e) => {
      e.x = state.bunny.x + 50;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 1000;
      e.maxHp = 1000;
    });
    // Halfway out the 70px splash radius: partial falloff, no direct bonus.
    const halfway = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 50 + 35;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 1000;
      e.maxHp = 1000;
    });
    // Outside the 70px splash radius entirely: untouched.
    const outside = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 50 + 80;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 1000;
      e.maxHp = 1000;
    });

    step(state, NO_INPUT, 0);
    step(state, NO_INPUT, 5);

    // Splash at 35/70 -> 50% falloff: 12 * 0.5 = 6, no direct bonus (not the primary).
    expect(1000 - halfway!.hp).toBeCloseTo(6);
    expect(outside!.hp).toBe(1000);
  });
});
