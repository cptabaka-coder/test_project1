import { describe, expect, it } from "vitest";
import { SHAMBLER_RADIUS } from "../../src/data/constants";
import { WOODEN_STAKE } from "../../src/data/weapons";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

const VAMPIRE_HP = 10_000; // effectively unkillable, so one hit's damage can be read off cleanly

function equipStake(state: ReturnType<typeof createInitialState>) {
  state.bunny.weaponSlots[0]!.weapon = WOODEN_STAKE;
}

describe("step", () => {
  it("Wooden Stake hits only the single nearest enemy, not a sweep", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    equipStake(state);

    const near = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 15; // the nearest, within the Stake's 45px range
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });
    const alsoInRange = state.enemies.spawn((e) => {
      e.x = state.bunny.x;
      e.y = state.bunny.y + 25; // also within range, but not the nearest
      e.radius = SHAMBLER_RADIUS;
      e.hp = 100;
      e.maxHp = 100;
    });

    step(state, NO_INPUT, 0);

    expect(near!.hp).toBeLessThan(100);
    expect(alsoInRange!.hp).toBe(100); // untouched — the Stake is single-target
  });

  it("deals +100% bonus damage to a target Weak to the Stake (a Vampire)", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    equipStake(state);

    const vampire = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 15;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = VAMPIRE_HP;
      e.maxHp = VAMPIRE_HP;
      e.weakness = { against: "stake", multiplier: 2 };
    });

    step(state, NO_INPUT, 0);

    // Level I: 14 base damage, no Family/Damage% bonuses, 0% Crit Chance (never crits).
    expect(VAMPIRE_HP - vampire!.hp).toBeCloseTo(14 * 2);
  });

  it("deals only base damage to a target with no Stake Weakness", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    equipStake(state);

    const zombie = state.enemies.spawn((e) => {
      e.x = state.bunny.x + 15;
      e.y = state.bunny.y;
      e.radius = SHAMBLER_RADIUS;
      e.hp = VAMPIRE_HP;
      e.maxHp = VAMPIRE_HP;
      e.weakness = { against: "Plasma", multiplier: 1.3 }; // not Weak to the Stake
    });

    step(state, NO_INPUT, 0);

    expect(VAMPIRE_HP - zombie!.hp).toBeCloseTo(14);
  });
});
