import { describe, expect, it } from "vitest";
import { FLEDGLING, SPITTER, STALKER } from "../../src/data/enemies";
import { scaledHp } from "../../src/sim/bandScaling";
import { initEnemyFromBand } from "../../src/sim/enemyFromBand";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("initEnemyFromBand", () => {
  it("applies the Band's per-Wave HP scaling to the spawned enemy", () => {
    const state = createInitialState(1);
    const enemy = state.enemies.spawn((e) => initEnemyFromBand(e, SPITTER, 3, 0, 0));

    expect(enemy?.hp).toBeCloseTo(scaledHp(SPITTER.hp, 3));
    expect(enemy?.maxHp).toBeCloseTo(scaledHp(SPITTER.hp, 3));
  });
});

describe("the roster in play", () => {
  it("a Spitter fires a ranged spit once the bunny is in range", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.enemies.spawn((e) => initEnemyFromBand(e, SPITTER, 3, state.bunny.x - 100, state.bunny.y));

    step(state, NO_INPUT, 0);

    let projectileCount = 0;
    state.projectiles.forEachActive(() => {
      projectileCount += 1;
    });
    expect(projectileCount).toBe(1);
  });

  it("a Fledgling dashes and heals off the contact damage it deals (Lifesteal)", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.bunny.weaponSlots[0]!.weapon = undefined; // isolate contact damage from the Knife
    const enemy = state.enemies.spawn((e) =>
      initEnemyFromBand(e, FLEDGLING, 2, state.bunny.x, state.bunny.y),
    );
    enemy!.hp = 1; // damaged, room to heal

    step(state, NO_INPUT, 0); // already overlapping the bunny: deals contact damage this tick

    expect(state.bunny.hp).toBeLessThan(12);
    expect(enemy!.hp).toBeGreaterThan(1); // healed off the hit (100% Lifesteal)
  });

  it("a Stalker flies (ignores the stage edge) and attacks only at range, never by contact", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const enemy = state.enemies.spawn((e) =>
      initEnemyFromBand(e, STALKER, 4, state.bunny.x, state.bunny.y),
    );

    expect(enemy?.flies).toBe(true);
    expect(enemy?.contactDamage).toBe(0);
    expect(enemy?.ranged).toBeDefined();
  });
});
