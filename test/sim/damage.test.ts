import { describe, expect, it } from "vitest";
import { calculateDamage, capDodgeChance, rollCrit } from "../../src/sim/damage";
import { Rng } from "../../src/sim/rng";

describe("calculateDamage", () => {
  it("adds the Family stat to base damage, then applies global Damage%", () => {
    const damage = calculateDamage({
      baseDamage: 6,
      familyStat: 4, // e.g. Melee Damage stat
      globalDamagePercent: 50,
      isCrit: false,
      targetArmor: 0,
      weaknessMultiplier: 1,
    });

    // (6 + 4) * 1.50 = 15
    expect(damage).toBeCloseTo(15);
  });

  it("applies the fixed 1.5x multiplier on a crit", () => {
    const damage = calculateDamage({
      baseDamage: 10,
      familyStat: 0,
      globalDamagePercent: 0,
      isCrit: true,
      targetArmor: 0,
      weaknessMultiplier: 1,
    });

    expect(damage).toBeCloseTo(15);
  });

  it("reduces damage using the armor/(armor+100) formula", () => {
    const damage = calculateDamage({
      baseDamage: 100,
      familyStat: 0,
      globalDamagePercent: 0,
      isCrit: false,
      targetArmor: 100, // reduction = 100/(100+100) = 50%
      weaknessMultiplier: 1,
    });

    expect(damage).toBeCloseTo(50);
  });

  it("applies a weakness multiplier against the target's Weakness", () => {
    const damage = calculateDamage({
      baseDamage: 10,
      familyStat: 0,
      globalDamagePercent: 0,
      isCrit: false,
      targetArmor: 0,
      weaknessMultiplier: 1.3, // e.g. Plasma vs. Zombie
    });

    expect(damage).toBeCloseTo(13);
  });
});

describe("rollCrit", () => {
  it("never crits at 0% chance and always crits at 100% chance", () => {
    const rng = new Rng(1);

    expect(rollCrit(0, rng)).toBe(false);
    expect(rollCrit(100, rng)).toBe(true);
  });
});

describe("capDodgeChance", () => {
  it("caps Dodge% at 60, passing lower values through unchanged", () => {
    expect(capDodgeChance(85)).toBe(60);
    expect(capDodgeChance(30)).toBe(30);
  });
});
