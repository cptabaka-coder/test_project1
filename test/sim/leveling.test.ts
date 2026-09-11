import { describe, expect, it } from "vitest";
import { carrotThresholdForLevel, levelForCarrots } from "../../src/sim/leveling";

describe("carrotThresholdForLevel", () => {
  it("is 8 Carrots for Level 2 (design spec §8)", () => {
    expect(carrotThresholdForLevel(2)).toBe(8);
  });

  it("compounds x1.5 for each Level after 2", () => {
    expect(carrotThresholdForLevel(3)).toBeCloseTo(12);
    expect(carrotThresholdForLevel(4)).toBeCloseTo(18);
  });
});

describe("levelForCarrots", () => {
  it("starts at Level 1 with 0 Carrots", () => {
    expect(levelForCarrots(0)).toBe(1);
  });

  it("stays at Level 1 just below the Level 2 threshold", () => {
    expect(levelForCarrots(7)).toBe(1);
  });

  it("reaches Level 2 exactly at its threshold", () => {
    expect(levelForCarrots(8)).toBe(2);
  });

  it("reaches Level 3 at its (compounded) threshold", () => {
    expect(levelForCarrots(12)).toBe(3);
  });

  it("can jump multiple Levels at once from a single large gain", () => {
    expect(levelForCarrots(19)).toBe(4); // >= threshold(4) = 18
  });
});
