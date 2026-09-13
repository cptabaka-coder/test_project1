import { describe, expect, it } from "vitest";
import {
  BOSS_TELEGRAPH_SECONDS,
  SPORE_BURST_CLOUD_COUNT,
  SPORE_BURST_CLOUD_DAMAGE_PER_SECOND,
} from "../../src/data/boss";
import { createBoss } from "../../src/sim/boss";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("lobs Spore Burst clouds only in Phase 2, once its telegraph lands", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.boss = createBoss(0, 0);
    state.boss.hp = state.boss.maxHp / 2; // Phase 2
    state.boss.sporeBurst.cooldownRemaining = 0;

    step(state, NO_INPUT, 0); // enters Phase 2, triggers the telegraph
    step(state, NO_INPUT, BOSS_TELEGRAPH_SECONDS + 0.01); // telegraph lands

    let count = 0;
    state.sporeClouds.forEachActive(() => {
      count += 1;
    });
    expect(count).toBe(SPORE_BURST_CLOUD_COUNT);
  });

  it("damages the bunny continuously while stood in a cloud", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.sporeClouds.spawn((c) => {
      c.x = state.bunny.x;
      c.y = state.bunny.y;
      c.radius = 45;
      c.damagePerSecond = SPORE_BURST_CLOUD_DAMAGE_PER_SECOND;
      c.secondsRemaining = 4;
    });

    step(state, NO_INPUT, 1);

    expect(state.bunny.hp).toBeCloseTo(state.bunny.maxHp - SPORE_BURST_CLOUD_DAMAGE_PER_SECOND);
  });

  it("expires a cloud once its remaining lifetime elapses", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.sporeClouds.spawn((c) => {
      c.x = 0;
      c.y = 0;
      c.radius = 45;
      c.damagePerSecond = SPORE_BURST_CLOUD_DAMAGE_PER_SECOND;
      c.secondsRemaining = 1;
    });

    step(state, NO_INPUT, 1.5);

    let count = 0;
    state.sporeClouds.forEachActive(() => {
      count += 1;
    });
    expect(count).toBe(0);
  });
});
