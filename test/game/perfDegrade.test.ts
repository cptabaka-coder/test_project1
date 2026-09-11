import { describe, expect, it } from "vitest";
import { nextEnemyCap } from "../../src/game/perfDegrade";

describe("nextEnemyCap", () => {
  it("steps the cap down when the frame is slow, never below the floor", () => {
    const result = nextEnemyCap({
      currentCap: 400,
      baseCap: 400,
      floorCap: 100,
      isFrameSlow: true,
      stepDown: 50,
    });

    expect(result).toBe(350);
  });

  it("holds at the floor once already degraded that far", () => {
    const result = nextEnemyCap({
      currentCap: 120,
      baseCap: 400,
      floorCap: 100,
      isFrameSlow: true,
      stepDown: 50,
    });

    expect(result).toBe(100);
  });

  it("recovers the cap when the frame is fast, never above the base cap", () => {
    const result = nextEnemyCap({
      currentCap: 350,
      baseCap: 400,
      floorCap: 100,
      isFrameSlow: false,
      stepDown: 50,
    });

    expect(result).toBe(400);
  });

  it("holds at the base cap once fully recovered", () => {
    const result = nextEnemyCap({
      currentCap: 400,
      baseCap: 400,
      floorCap: 100,
      isFrameSlow: false,
      stepDown: 50,
    });

    expect(result).toBe(400);
  });
});
