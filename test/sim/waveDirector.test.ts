import { describe, expect, it } from "vitest";
import {
  ARENA_MARGIN,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  WAVE_1_DURATION_S,
  WAVE_1_SHAMBLER_COUNT,
  WAVE_DURATIONS_S,
  WAVE_TOTAL_COUNTS,
} from "../../src/data/constants";
import { FLEDGLING, SHAMBLER, SPITTER, STALKER } from "../../src/data/enemies";
import { Rng } from "../../src/sim/rng";
import {
  drainDueSpawns,
  generateWaveBudget,
  pickSpawnPosition,
  pickWaveEnemyBand,
} from "../../src/sim/waveDirector";

describe("generateWaveBudget", () => {
  it("produces the expected Shambler count for Wave 1", () => {
    const schedule = generateWaveBudget(1, new Rng(1));

    expect(schedule).toHaveLength(WAVE_1_SHAMBLER_COUNT);
  });

  it("spreads Wave 1's spawns continuously across the wave, not bunched at the start", () => {
    const schedule = generateWaveBudget(1, new Rng(1));

    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]!).toBeGreaterThan(schedule[i - 1]!);
    }
    expect(schedule[0]!).toBeGreaterThanOrEqual(0);
    expect(schedule.at(-1)!).toBeLessThan(WAVE_1_DURATION_S);
  });

  it("is deterministic for a given seed, and varies pacing across seeds", () => {
    const a = generateWaveBudget(1, new Rng(42));
    const b = generateWaveBudget(1, new Rng(42));
    const c = generateWaveBudget(1, new Rng(43));

    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("produces the expected count and stays within duration for Waves 2-4", () => {
    for (const wave of [2, 3, 4]) {
      const schedule = generateWaveBudget(wave, new Rng(1));

      expect(schedule).toHaveLength(WAVE_TOTAL_COUNTS[wave]!);
      expect(schedule.at(-1)!).toBeLessThan(WAVE_DURATIONS_S[wave]!);
    }
  });

  it("produces an empty schedule for Wave 5 — the Boss fight has no timed budget", () => {
    expect(generateWaveBudget(5, new Rng(1))).toEqual([]);
  });
});

describe("drainDueSpawns", () => {
  it("spawns every event whose time has arrived, when capacity allows", () => {
    const schedule = [0, 1, 5]; // last one isn't due yet at elapsed=2
    let spawnCount = 0;

    drainDueSpawns(schedule, 2, () => {
      spawnCount += 1;
      return true;
    });

    expect(spawnCount).toBe(2);
    expect(schedule).toEqual([5]);
  });

  it("keeps a due event queued for retry instead of dropping it when spawn fails", () => {
    const schedule = [0, 1]; // both due
    let attempts = 0;

    // Capacity for one: the first spawn succeeds, the second (still due) fails.
    drainDueSpawns(schedule, 2, () => {
      attempts += 1;
      return attempts === 1;
    });

    expect(attempts).toBe(2);
    expect(schedule).toEqual([1]); // not dropped — still queued at the front

    // Capacity frees up: the retry on a later tick picks it up, in order.
    let secondAttempts = 0;
    drainDueSpawns(schedule, 3, () => {
      secondAttempts += 1;
      return true;
    });

    expect(secondAttempts).toBe(1);
    expect(schedule).toEqual([]);
  });
});

describe("pickWaveEnemyBand", () => {
  it("only ever picks Shambler at Wave 1 (no other Band is eligible yet)", () => {
    const rng = new Rng(1);
    for (let i = 0; i < 20; i++) {
      expect(pickWaveEnemyBand(1, rng)).toBe(SHAMBLER);
    }
  });

  it("picks only Bands eligible for the given Wave", () => {
    const rng = new Rng(1);
    for (let i = 0; i < 50; i++) {
      const band = pickWaveEnemyBand(4, rng);
      expect(band.bandStart).toBeLessThanOrEqual(4);
      expect(band.bandEnd).toBeGreaterThanOrEqual(4);
    }
  });

  it("can pick every Band eligible for Wave 4 across enough rolls", () => {
    const rng = new Rng(1);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(pickWaveEnemyBand(4, rng).id);

    expect(seen).toEqual(new Set([SHAMBLER.id, SPITTER.id, FLEDGLING.id, STALKER.id]));
  });
});

describe("pickSpawnPosition", () => {
  it("always lands just outside the arena's walls, never inside them", () => {
    const rng = new Rng(7);

    for (let i = 0; i < 200; i++) {
      const { x, y } = pickSpawnPosition(rng);
      const insideWalls =
        x > ARENA_MARGIN &&
        x < LOGICAL_WIDTH - ARENA_MARGIN &&
        y > ARENA_MARGIN &&
        y < LOGICAL_HEIGHT - ARENA_MARGIN;
      expect(insideWalls).toBe(false);
    }
  });
});
