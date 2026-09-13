import { describe, expect, it } from "vitest";
import { SHAMBLER_HP, SHAMBLER_RADIUS } from "../../src/data/constants";
import { KNIFE, LASER_PISTOL, PLASMA_CANNON, WOODEN_STAKE } from "../../src/data/weapons";
import { createInitialState } from "../../src/sim/types";
import { tickWeaponFiring } from "../../src/sim/weaponFiring";

function fire(state: ReturnType<typeof createInitialState>) {
  return tickWeaponFiring(
    { bunny: state.bunny, enemies: state.enemies, projectiles: state.projectiles, pickups: state.pickups, rng: state.rng },
    0,
  );
}

describe("tickWeaponFiring", () => {
  it("dispatches a melee-arc weapon (the Knife) at the nearest enemy in range", () => {
    const state = createInitialState(1);
    const enemy = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 30; // within the Knife's 60px range, directly ahead
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = SHAMBLER_HP;
      e.speed = 0;
      e.contactDamage = 0;
    });

    fire(state);

    expect(enemy?.hp).toBe(SHAMBLER_HP - KNIFE.levels[0]!.damage);
  });

  it("dispatches a melee-single weapon (the Wooden Stake) at only the nearest enemy", () => {
    const state = createInitialState(1);
    state.bunny.weaponSlots[0]!.weapon = WOODEN_STAKE;
    const near = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 15; // within the Stake's 45px range
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });
    const alsoInRange = state.enemies.spawn((e) => {
      e.x = state.bunny.x;
      e.y = state.bunny.y + 25; // also in range, but not the nearest
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });

    fire(state);

    expect(near?.hp).toBeLessThan(100);
    expect(alsoInRange?.hp).toBe(100); // untouched — single-target only
  });

  it("dispatches a hitscan weapon (the Laser Pistol) along its line, up to its pierce count", () => {
    const state = createInitialState(1);
    state.bunny.weaponSlots[0]!.weapon = LASER_PISTOL; // pierceCount 2
    const near = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 30;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });
    const mid = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 60;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });
    const far = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 90;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });

    fire(state);

    expect(near?.hp).toBeLessThan(100);
    expect(mid?.hp).toBeLessThan(100);
    expect(far?.hp).toBe(100); // beyond the pierce count — untouched
  });

  it("dispatches a lobbed-aoe weapon (the Plasma Cannon) by spawning a travelling AoE shot, not an immediate hit", () => {
    const state = createInitialState(1);
    state.bunny.weaponSlots[0]!.weapon = PLASMA_CANNON;
    const target = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 50;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 1000;
      e.maxHp = 1000;
    });

    fire(state);

    expect(target?.hp).toBe(1000); // no direct hit yet — resolves when the shot lands
    let liveProjectiles = 0;
    state.projectiles.forEachActive((p) => {
      liveProjectiles += 1;
      expect(p.aoe?.splashRadius).toBe(PLASMA_CANNON.levels[0]!.splashRadius);
      expect(p.damage).toBe(PLASMA_CANNON.levels[0]!.damage);
    });
    expect(liveProjectiles).toBe(1);
  });
});
