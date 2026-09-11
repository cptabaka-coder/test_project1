import { describe, expect, it } from "vitest";
import { bandMultiplier, scaledContactDamage, scaledHp } from "../../src/sim/bandScaling";

describe("bandMultiplier", () => {
  it("is 1 at Wave 1 (base values, no scaling yet)", () => {
    expect(bandMultiplier(1)).toBeCloseTo(1);
  });

  it("compounds +12% per Wave past Wave 1 (ADR 0003)", () => {
    expect(bandMultiplier(2)).toBeCloseTo(1.12);
    expect(bandMultiplier(3)).toBeCloseTo(1.12 * 1.12);
  });
});

describe("scaledHp / scaledContactDamage", () => {
  it("scales a base stat by the Wave's band multiplier", () => {
    expect(scaledHp(10, 3)).toBeCloseTo(10 * 1.12 * 1.12);
    expect(scaledContactDamage(3, 3)).toBeCloseTo(3 * 1.12 * 1.12);
  });
});
