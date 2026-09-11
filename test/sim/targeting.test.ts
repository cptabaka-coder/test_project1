import { describe, expect, it } from "vitest";
import { findNearestEnemy } from "../../src/sim/targeting";
import { createInitialState } from "../../src/sim/types";

describe("findNearestEnemy", () => {
  it("picks the closest active enemy to a point, not just the first spawned", () => {
    const { enemies } = createInitialState(1);
    enemies.spawn((e) => {
      e.x = 100;
      e.y = 0;
    });
    const nearest = enemies.spawn((e) => {
      e.x = 10;
      e.y = 0;
    });
    enemies.spawn((e) => {
      e.x = 50;
      e.y = 0;
    });

    expect(findNearestEnemy(0, 0, enemies)).toBe(nearest);
  });
});
