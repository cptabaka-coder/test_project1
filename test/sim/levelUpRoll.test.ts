import { describe, expect, it } from "vitest";
import { STAT_GAIN_POOL } from "../../src/data/levelUpPool";
import { Rng } from "../../src/sim/rng";
import { rollLevelUpOptions } from "../../src/sim/levelUpRoll";

describe("rollLevelUpOptions", () => {
  it("returns exactly 3 distinct options, every one drawn from the pool", () => {
    const rolled = rollLevelUpOptions(STAT_GAIN_POOL, new Rng(1), 3);

    expect(rolled).toHaveLength(3);
    for (const option of rolled) {
      expect(STAT_GAIN_POOL).toContain(option);
    }
    expect(new Set(rolled).size).toBe(3); // no duplicates
  });

  it("is deterministic for a given seed, and varies across seeds", () => {
    const a = rollLevelUpOptions(STAT_GAIN_POOL, new Rng(42), 3);
    const b = rollLevelUpOptions(STAT_GAIN_POOL, new Rng(42), 3);
    const c = rollLevelUpOptions(STAT_GAIN_POOL, new Rng(43), 3);

    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});
