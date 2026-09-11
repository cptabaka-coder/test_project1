import { describe, expect, it } from "vitest";
import { SHAMBLER_HP, SHAMBLER_RADIUS } from "../../src/data/constants";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

function spawnDashingEnemy(state: ReturnType<typeof createInitialState>, startX: number) {
  return state.enemies.spawn((e) => {
    e.x = startX;
    e.y = state.bunny.y;
    e.radius = SHAMBLER_RADIUS;
    e.hp = SHAMBLER_HP;
    e.maxHp = SHAMBLER_HP;
    e.speed = 20;
    e.dash = {
      speedMultiplier: 3,
      durationSeconds: 0.3,
      cooldownSeconds: 3,
      cooldownRemaining: 0,
      activeSecondsRemaining: 0,
    };
  });
}

describe("step", () => {
  it("moves a dashing enemy at speed * its dash multiplier once its cooldown is ready", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const startX = state.bunny.x - 100;
    const enemy = spawnDashingEnemy(state, startX);

    step(state, NO_INPUT, 0.1); // cooldownRemaining is 0, so the dash triggers this tick

    expect(enemy!.x).toBeCloseTo(startX + 20 * 3 * 0.1);
  });

  it("returns to base speed once the dash's duration has elapsed", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const startX = state.bunny.x - 500;
    const enemy = spawnDashingEnemy(state, startX);

    step(state, NO_INPUT, 0.01); // triggers the dash (cooldownRemaining was 0)
    const afterTriggerX = enemy!.x;

    step(state, NO_INPUT, 1); // dt exceeds the 0.3s duration — it fully expires this tick

    expect(enemy!.x).toBeCloseTo(afterTriggerX + 20 * 1); // base speed only, no multiplier
  });
});
