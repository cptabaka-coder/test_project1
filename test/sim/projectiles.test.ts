import { describe, expect, it } from "vitest";
import { BUNNY_MAX_HP, SHAMBLER_HP, SHAMBLER_RADIUS } from "../../src/data/constants";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

function spawnRangedEnemy(
  state: ReturnType<typeof createInitialState>,
  overrides: Partial<{ x: number; y: number; lifestealPercent: number }> = {},
) {
  return state.enemies.spawn((e) => {
    e.x = overrides.x ?? state.bunny.x - 100;
    e.y = overrides.y ?? state.bunny.y;
    e.radius = SHAMBLER_RADIUS;
    e.hp = SHAMBLER_HP;
    e.maxHp = SHAMBLER_HP;
    e.speed = 0;
    e.contactDamage = 0;
    e.flies = false;
    e.lifestealPercent = overrides.lifestealPercent ?? 0;
    e.ranged = {
      damage: 4,
      projectileSpeed: 200,
      range: 150,
      cooldownSeconds: 2,
      cooldownRemaining: 0,
    };
  });
}

describe("step", () => {
  it("fires a projectile at the bunny once a ranged enemy is in range and off cooldown", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    spawnRangedEnemy(state); // 100px away, within its 150px range

    step(state, NO_INPUT, 0);

    let count = 0;
    state.projectiles.forEachActive(() => {
      count += 1;
    });
    expect(count).toBe(1);
  });

  it("damages the bunny when a projectile reaches it", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.projectiles.spawn((p) => {
      p.x = state.bunny.x;
      p.y = state.bunny.y;
      p.vx = 0;
      p.vy = 0;
      p.radius = 4;
      p.damage = 4;
      p.ttlSeconds = 3;
    });

    step(state, NO_INPUT, 0);

    expect(state.bunny.hp).toBe(BUNNY_MAX_HP - 4);
  });

  it("heals the firing enemy (Lifesteal) when its projectile lands, capped at its max HP", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const owner = spawnRangedEnemy(state, { lifestealPercent: 100 });
    owner!.hp = 2; // damaged, well under its max — room to heal without hitting the cap

    state.projectiles.spawn((p) => {
      p.x = state.bunny.x;
      p.y = state.bunny.y;
      p.vx = 0;
      p.vy = 0;
      p.radius = 4;
      p.damage = 4;
      p.ttlSeconds = 3;
      p.lifestealPercent = 100;
      p.owner = owner;
    });

    step(state, NO_INPUT, 0);

    expect(owner!.hp).toBe(2 + 4); // full damage returned as HP at 100% Lifesteal
  });

  it("never heals the firing enemy past its own max HP", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const owner = spawnRangedEnemy(state, { lifestealPercent: 100 });
    owner!.hp = owner!.maxHp - 1; // 1 HP of room only

    state.projectiles.spawn((p) => {
      p.x = state.bunny.x;
      p.y = state.bunny.y;
      p.vx = 0;
      p.vy = 0;
      p.radius = 4;
      p.damage = 10; // far more healing than the 1 HP of room available
      p.ttlSeconds = 3;
      p.lifestealPercent = 100;
      p.owner = owner;
    });

    step(state, NO_INPUT, 0);

    expect(owner!.hp).toBe(owner!.maxHp);
  });

  it("skips the Lifesteal heal if the firing enemy has already despawned", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const owner = spawnRangedEnemy(state, { lifestealPercent: 100 });
    state.enemies.despawn(owner!); // the firer died before its shot landed

    state.projectiles.spawn((p) => {
      p.x = state.bunny.x;
      p.y = state.bunny.y;
      p.vx = 0;
      p.vy = 0;
      p.radius = 4;
      p.damage = 4;
      p.ttlSeconds = 3;
      p.lifestealPercent = 100;
      p.owner = owner;
    });

    expect(() => step(state, NO_INPUT, 0)).not.toThrow();
    expect(state.bunny.hp).toBe(BUNNY_MAX_HP - 4); // the hit still lands...
    expect(state.enemies.isActive(owner!)).toBe(false); // ...but nothing got healed
  });

  it("holds its distance once in range, instead of closing to melee like a chaser", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    const enemy = spawnRangedEnemy(state); // 100px away, its range is 150
    enemy!.speed = 40; // would otherwise close the distance fast

    step(state, NO_INPUT, 1);

    expect(enemy!.x).toBeCloseTo(state.bunny.x - 100);
  });
});
