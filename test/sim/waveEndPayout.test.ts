import { describe, expect, it } from "vitest";
import { waveEndPayout } from "../../src/sim/waveEndPayout";

describe("waveEndPayout", () => {
  it("is 5 + wave*3 with no Harvesting bonus (design spec §8)", () => {
    expect(waveEndPayout(1, 0)).toBe(8);
    expect(waveEndPayout(4, 0)).toBe(17);
  });

  it("adds the Harvesting Stat on top", () => {
    expect(waveEndPayout(1, 3)).toBe(11);
  });
});
