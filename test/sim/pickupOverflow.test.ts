import { describe, expect, it } from "vitest";
import { CAP_PICKUPS, CARROT_RADIUS, SHAMBLER_RADIUS } from "../../src/data/constants";
import { KNIFE } from "../../src/data/weapons";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("vacuums the oldest Carrot instead of dropping a new kill's drop at the Pickup cap", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.bunny.weaponSlots[0]!.weapon = KNIFE;

    // Fill the Pickup store to its cap, far from the bunny so they're untouched.
    for (let i = 0; i < CAP_PICKUPS; i++) {
      state.pickups.spawn((c) => {
        c.x = 0;
        c.y = 0;
        c.radius = CARROT_RADIUS;
        c.value = 1;
      });
    }
    let countBefore = 0;
    state.pickups.forEachActive(() => {
      countBefore += 1;
    });
    expect(countBefore).toBe(CAP_PICKUPS); // sanity: the store really is full

    state.enemies.spawn((e) => {
      e.x = state.bunny.x + 20; // within the Knife's range
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 1;
      e.maxHp = 1;
    });

    step(state, NO_INPUT, 0); // kills the enemy, which drops a Carrot at the full cap

    let countAfter = 0;
    let sawNewDrop = false;
    state.pickups.forEachActive((c) => {
      countAfter += 1;
      if (c.x !== 0 || c.y !== 0) sawNewDrop = true; // the fill Carrots all sit at (0,0)
    });
    expect(countAfter).toBe(CAP_PICKUPS); // still at cap — vacuumed, not overflowed
    expect(sawNewDrop).toBe(true); // the new kill's Carrot actually made it in
  });
});
