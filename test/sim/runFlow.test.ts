import { describe, expect, it } from "vitest";
import { continueToNextWave, startRun } from "../../src/sim/runFlow";
import { createInitialState } from "../../src/sim/types";

describe("continueToNextWave", () => {
  it("advances the Wave, regenerates its schedule, and resumes the Wave phase", () => {
    const state = createInitialState(1);
    state.phase = "Shop";
    state.waveElapsedSeconds = 999;

    continueToNextWave(state);

    expect(state.wave).toBe(2);
    expect(state.waveElapsedSeconds).toBe(0);
    expect(state.waveSpawnSchedule.length).toBeGreaterThan(0);
    expect(state.phase).toBe("Wave");
  });

  it("spawns the Boss and clears the spawn schedule on reaching Wave 5", () => {
    const state = createInitialState(1);
    state.phase = "Shop";
    state.wave = 4;

    continueToNextWave(state);

    expect(state.wave).toBe(5);
    expect(state.boss).toBeDefined();
    expect(state.waveSpawnSchedule).toEqual([]);
  });
});

describe("startRun", () => {
  it("moves the bunny out of the Menu and into Wave 1", () => {
    const state = createInitialState(1);

    startRun(state);

    expect(state.phase).toBe("Wave");
  });
});
