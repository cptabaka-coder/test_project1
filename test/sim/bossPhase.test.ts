import { describe, expect, it } from "vitest";
import { bossPhaseForHp } from "../../src/sim/boss";

describe("bossPhaseForHp", () => {
  it("is Phase 1 above 50% HP", () => {
    expect(bossPhaseForHp(451, 450)).toBe(1);
    expect(bossPhaseForHp(226, 450)).toBe(1);
  });

  it("becomes Phase 2 at and below 50% HP (design spec §6)", () => {
    expect(bossPhaseForHp(225, 450)).toBe(2);
    expect(bossPhaseForHp(1, 450)).toBe(2);
  });
});
