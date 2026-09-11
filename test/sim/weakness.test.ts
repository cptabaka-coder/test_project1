import { describe, expect, it } from "vitest";
import { resolveWeaknessMultiplier } from "../../src/sim/weakness";

describe("resolveWeaknessMultiplier", () => {
  it("applies the bonus when the weapon's id matches the target's Weakness", () => {
    const multiplier = resolveWeaknessMultiplier(
      { against: "stake", multiplier: 2 }, // Fledgling/Stalker vs. Wooden Stake (design spec §6)
      "Melee",
      "stake",
    );

    expect(multiplier).toBe(2);
  });

  it("applies no bonus when the weapon doesn't match the target's Weakness", () => {
    const multiplier = resolveWeaknessMultiplier(
      { against: "stake", multiplier: 2 },
      "Melee",
      "knife", // Knife isn't the Stake — no bonus vs. a Stake-weak target
    );

    expect(multiplier).toBe(1);
  });

  it("matches on the Weapon Family for a Family-wide Weakness", () => {
    const multiplier = resolveWeaknessMultiplier(
      { against: "Plasma", multiplier: 1.3 }, // Shambler/Spitter vs. any Plasma weapon
      "Plasma",
      "plasma_cannon",
    );

    expect(multiplier).toBe(1.3);
  });

  it("applies no bonus when the target has no Weakness", () => {
    const multiplier = resolveWeaknessMultiplier(undefined, "Melee", "stake");

    expect(multiplier).toBe(1);
  });
});
