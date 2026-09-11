import { describe, expect, it } from "vitest";
import { SHAMBLER_HP, SHAMBLER_RADIUS, WAVE_1_DURATION_S } from "../../src/data/constants";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("opens the Shop and clears survivors once the Wave timer expires", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = []; // no more scheduled spawns
    state.waveElapsedSeconds = WAVE_1_DURATION_S - 0.01;
    state.enemies.spawn((e) => {
      e.x = 100;
      e.y = 100;
      e.radius = SHAMBLER_RADIUS;
      e.hp = SHAMBLER_HP;
      e.maxHp = SHAMBLER_HP;
    });

    step(state, NO_INPUT, 1); // crosses the Wave 1 duration this tick

    expect(state.phase).toBe("Shop");
    let activeEnemies = 0;
    state.enemies.forEachActive(() => {
      activeEnemies += 1;
    });
    expect(activeEnemies).toBe(0);
  });

  it("awards the Wave-end Carrot payout", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.waveElapsedSeconds = WAVE_1_DURATION_S - 0.01;
    const startCarrots = state.bunny.carrots;

    step(state, NO_INPUT, 1);

    // 5 + wave*3 with no Harvesting: 5 + 1*3 = 8 (design spec §8).
    expect(state.bunny.carrots).toBe(startCarrots + 8);
  });

  it("freezes the simulation once in Shop — no further enemy spawns or movement", () => {
    const state = createInitialState(1);
    state.phase = "Shop";
    state.waveSpawnSchedule = [0];

    step(state, NO_INPUT, 1);

    let activeCount = 0;
    state.enemies.forEachActive(() => {
      activeCount += 1;
    });
    expect(activeCount).toBe(0);
  });
});
