import { describe, expect, it } from "vitest";
import { splashFalloff } from "../../src/sim/splash";

describe("splashFalloff", () => {
  it("is full strength at the epicenter (distance 0)", () => {
    expect(splashFalloff(0, 70)).toBeCloseTo(1);
  });

  it("falls off linearly toward the radius edge", () => {
    expect(splashFalloff(35, 70)).toBeCloseTo(0.5);
  });

  it("is 0 at and beyond the radius", () => {
    expect(splashFalloff(70, 70)).toBeCloseTo(0);
    expect(splashFalloff(100, 70)).toBe(0);
  });
});
