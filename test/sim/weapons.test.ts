import { describe, expect, it } from "vitest";
import { hitscanLineHits, meleeArcHits } from "../../src/sim/weapons";
import { createInitialState } from "../../src/sim/types";

describe("meleeArcHits", () => {
  it("includes an enemy within range and inside the facing arc", () => {
    const { enemies } = createInitialState(1);
    const inFront = enemies.spawn((e) => {
      e.x = 30; // range/2, straight ahead of a swing facing +x
      e.y = 0;
      e.radius = 0;
    });

    const hits = meleeArcHits(0, 0, 0, 60, 60, enemies);

    expect(hits).toContain(inFront);
  });

  it("excludes an enemy within range but behind the swing, outside the arc", () => {
    const { enemies } = createInitialState(1);
    const behind = enemies.spawn((e) => {
      e.x = -30; // directly opposite the +x facing direction
      e.y = 0;
      e.radius = 0;
    });

    const hits = meleeArcHits(0, 0, 0, 60, 60, enemies);

    expect(hits).not.toContain(behind);
  });

  it("excludes an enemy inside the arc but beyond range", () => {
    const { enemies } = createInitialState(1);
    const tooFar = enemies.spawn((e) => {
      e.x = 200; // straight ahead, well past a 60px range
      e.y = 0;
      e.radius = 0;
    });

    const hits = meleeArcHits(0, 0, 0, 60, 60, enemies);

    expect(hits).not.toContain(tooFar);
  });
});

describe("hitscanLineHits", () => {
  it("hits an enemy standing on the line, within range", () => {
    const { enemies } = createInitialState(1);
    const onLine = enemies.spawn((e) => {
      e.x = 100; // straight ahead, facing +x
      e.y = 0;
      e.radius = 5;
    });

    const hits = hitscanLineHits(0, 0, 0, 500, 2, enemies);

    expect(hits).toContain(onLine);
  });

  it("misses an enemy well off the line", () => {
    const { enemies } = createInitialState(1);
    const offLine = enemies.spawn((e) => {
      e.x = 100;
      e.y = 80; // far off the +x line
      e.radius = 5;
    });

    const hits = hitscanLineHits(0, 0, 0, 500, 2, enemies);

    expect(hits).not.toContain(offLine);
  });

  it("hits at most pierceCount enemies, closest first", () => {
    const { enemies } = createInitialState(1);
    const near = enemies.spawn((e) => {
      e.x = 50;
      e.y = 0;
      e.radius = 5;
    });
    const mid = enemies.spawn((e) => {
      e.x = 100;
      e.y = 0;
      e.radius = 5;
    });
    const far = enemies.spawn((e) => {
      e.x = 150;
      e.y = 0;
      e.radius = 5;
    });

    const hits = hitscanLineHits(0, 0, 0, 500, 2, enemies);

    expect(hits).toEqual([near, mid]);
    expect(hits).not.toContain(far);
  });
});
