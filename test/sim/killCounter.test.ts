import { describe, expect, it } from "vitest";
import { SHAMBLER_RADIUS } from "../../src/data/constants";
import { KNIFE } from "../../src/data/weapons";
import { createBoss } from "../../src/sim/boss";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("counts an enemy kill toward the Run summary's total", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.bunny.weaponSlots[0]!.weapon = KNIFE;
    state.enemies.spawn((e) => {
      e.x = state.bunny.x + 20;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 1;
      e.maxHp = 1;
    });

    step(state, NO_INPUT, 0);

    expect(state.totalKills).toBe(1);
  });

  it("counts the Boss's death too", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.boss = createBoss(0, 0);
    state.boss.hp = 0;

    step(state, NO_INPUT, 0);

    expect(state.totalKills).toBe(1);
  });
});
