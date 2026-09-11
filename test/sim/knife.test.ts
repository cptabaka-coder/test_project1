import { describe, expect, it } from "vitest";
import { SHAMBLER_HP, SHAMBLER_RADIUS } from "../../src/data/constants";
import { KNIFE } from "../../src/data/weapons";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("fires the starting Knife at the nearest enemy, damaging it", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = []; // isolate weapon fire from wave spawning
    const enemy = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 30; // within the Knife's 60px range, directly ahead
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = SHAMBLER_HP;
      e.speed = 0;
      e.contactDamage = 0;
    });

    step(state, NO_INPUT, 0);

    expect(enemy?.hp).toBe(SHAMBLER_HP - KNIFE.levels[0]!.damage);
  });

  it("despawns an enemy the Knife brings to 0 HP", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.enemies.spawn((e) => {
      e.x = state.bunny.x + 30;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = KNIFE.levels[0]!.damage; // exactly lethal from one Knife hit
      e.speed = 0;
      e.contactDamage = 0;
    });

    step(state, NO_INPUT, 0);

    let activeCount = 0;
    state.enemies.forEachActive(() => {
      activeCount += 1;
    });
    expect(activeCount).toBe(0);
  });

  it("swings on cooldown even when the nearest enemy is out of the Knife's reach", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const farEnemy = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 500; // an active enemy exists, but far outside 60px range
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = SHAMBLER_HP;
      e.speed = 0;
      e.contactDamage = 0;
    });

    step(state, NO_INPUT, 0);

    expect(farEnemy?.hp).toBe(SHAMBLER_HP); // whiffed, no damage
    expect(state.bunny.weaponSlots[0]!.cooldownSeconds).toBeGreaterThan(0); // but it swung
  });
});
