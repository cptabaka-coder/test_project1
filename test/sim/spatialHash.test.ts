import { describe, expect, it } from "vitest";
import { createSpatialHash } from "../../src/sim/spatialHash";

describe("createSpatialHash", () => {
  it("returns an inserted entity when querying near its position", () => {
    const grid = createSpatialHash(48);

    grid.insert(1, 100, 100, 8);

    expect(grid.queryCircle(100, 100, 8)).toContain(1);
  });

  it("finds a neighbour across a cell boundary when the query circle reaches it", () => {
    const grid = createSpatialHash(48);

    // Cell size 48: x=47 sits in cell 0, x=50 sits in cell 1. The two circles
    // overlap (3px apart, radii 4 and 5) even though their centers fall in
    // different cells — a same-cell-only lookup would miss this.
    grid.insert(1, 47, 24, 4);

    expect(grid.queryCircle(50, 24, 5)).toContain(1);
  });

  it("does not return an entity whose cell is far outside the query circle", () => {
    const grid = createSpatialHash(48);

    grid.insert(1, 47, 24, 4);
    grid.insert(2, 500, 500, 4);

    expect(grid.queryCircle(50, 24, 5)).not.toContain(2);
  });

  it("forgets prior entities after clear, so a stale grid isn't queried", () => {
    const grid = createSpatialHash(48);

    grid.insert(1, 100, 100, 8);
    grid.clear();

    expect(grid.queryCircle(100, 100, 8)).not.toContain(1);
  });
});
