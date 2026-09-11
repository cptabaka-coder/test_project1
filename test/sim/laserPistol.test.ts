import { describe, expect, it } from "vitest";
import { SHAMBLER_RADIUS } from "../../src/data/constants";
import { LASER_PISTOL } from "../../src/data/weapons";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

function equipLaserPistol(state: ReturnType<typeof createInitialState>) {
  state.bunny.weaponSlots[0]!.weapon = LASER_PISTOL;
}

describe("step", () => {
  it("Laser Pistol hits enemies along its line, up to its pierce count", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    equipLaserPistol(state);

    // Three enemies collinear east of the bunny; pierceCount is 2.
    const near = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 30;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });
    const mid = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 60;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });
    const far = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 90;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });

    step(state, NO_INPUT, 0);

    expect(near!.hp).toBeLessThan(100);
    expect(mid!.hp).toBeLessThan(100);
    expect(far!.hp).toBe(100); // beyond the pierce count — untouched
  });
});
