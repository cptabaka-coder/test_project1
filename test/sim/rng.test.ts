import { describe, expect, it } from "vitest";
import { Rng } from "../../src/sim/rng";

describe("Rng", () => {
  it("produces the same sequence for two generators created with the same seed", () => {
    const a = new Rng(12345);
    const b = new Rng(12345);

    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());

    expect(seqA).toEqual(seqB);
  });

  it("returns floats in [0, 1)", () => {
    const rng = new Rng(1);
    for (let i = 0; i < 10_000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("draws integers in [0, maxExclusive) with int()", () => {
    const rng = new Rng(99);
    const counts = new Array<number>(6).fill(0);
    for (let i = 0; i < 6_000; i++) {
      const roll = rng.int(6);
      expect(Number.isInteger(roll)).toBe(true);
      expect(roll).toBeGreaterThanOrEqual(0);
      expect(roll).toBeLessThan(6);
      counts[roll]!++;
    }
    // Every bucket should be hit; a broken shift/scale usually starves one.
    expect(counts.every((c) => c > 0)).toBe(true);
  });

  it("gives different sequences for different seeds", () => {
    const a = Array.from({ length: 20 }, ((r) => () => r.next())(new Rng(1)));
    const b = Array.from({ length: 20 }, ((r) => () => r.next())(new Rng(2)));
    expect(a).not.toEqual(b);
  });

  // Regression guard, not a correctness claim (the properties above cover that).
  // If this snapshot changes, the PRNG algorithm changed and every seeded Run
  // moved with it — that must be a deliberate call, not an accident.
  it("has a stable output sequence for a fixed seed", () => {
    const rng = new Rng(0xdecafbad);
    const seq = Array.from({ length: 5 }, () => Number(rng.next().toFixed(10)));
    expect(seq).toMatchInlineSnapshot(`
      [
        0.5221733784,
        0.2471063151,
        0.1635639237,
        0.1573961927,
        0.5730833854,
      ]
    `);
  });
});
