import { describe, expect, it } from "vitest";
import { drainAccumulator } from "../../src/game/accumulator";

const FIXED = 1000 / 60; // ms per simulation step

describe("drainAccumulator", () => {
  it("runs exactly one step for a frame that took one fixed step of real time", () => {
    const r = drainAccumulator(0, FIXED, FIXED, 5);
    expect(r.steps).toBe(1);
  });

  it("runs no step for a frame shorter than one fixed step, banking the time", () => {
    const r = drainAccumulator(0, 10, FIXED, 5);
    expect(r.steps).toBe(0);
    expect(r.accumMs).toBeCloseTo(10);
    expect(r.alpha).toBeCloseTo(10 / FIXED);
  });

  it("fires a banked step once enough short frames accumulate", () => {
    // Two 10ms frames = 20ms of banked time, past one 16.67ms step.
    const first = drainAccumulator(0, 10, FIXED, 5);
    const second = drainAccumulator(first.accumMs, 10, FIXED, 5);
    expect(second.steps).toBe(1);
    expect(second.accumMs).toBeCloseTo(20 - FIXED);
  });

  it("clamps a long stall to maxSteps instead of spiralling", () => {
    // Tab backgrounded for half a second: ~30 steps' worth of real time.
    const r = drainAccumulator(0, 500, FIXED, 5);
    expect(r.steps).toBe(5);
  });

  it("drops the excess time after a clamped stall so it does not compound", () => {
    const r = drainAccumulator(0, 500, FIXED, 5);
    // The ~25 unsimulated steps are gone, not banked for next frame.
    expect(r.accumMs).toBeLessThan(FIXED);
    expect(r.alpha).toBeGreaterThanOrEqual(0);
    expect(r.alpha).toBeLessThan(1);
  });

  it("always leaves a carry-over of less than one step, with alpha in [0, 1)", () => {
    const deltas = [0, 0.1, 5, 16.666, 16.667, 17, 33.4, 100, 250, 999, 5000];
    for (const startAcc of [0, 3, FIXED - 0.001]) {
      for (const d of deltas) {
        const r = drainAccumulator(startAcc, d, FIXED, 5);
        expect(r.steps).toBeGreaterThanOrEqual(0);
        expect(r.steps).toBeLessThanOrEqual(5);
        expect(r.accumMs).toBeGreaterThanOrEqual(0);
        expect(r.accumMs).toBeLessThan(FIXED);
        expect(r.alpha).toBeGreaterThanOrEqual(0);
        expect(r.alpha).toBeLessThan(1);
      }
    }
  });
});
