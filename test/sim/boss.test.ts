import { describe, expect, it } from "vitest";
import { BLOATLORD_CONTACT_DAMAGE, BOSS_TELEGRAPH_SECONDS } from "../../src/data/boss";
import { createBoss, createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("deals the Boss's Contact damage when it touches the bunny", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.boss = createBoss(state.bunny.x, state.bunny.y); // overlapping

    step(state, NO_INPUT, 0);

    expect(state.bunny.hp).toBe(state.bunny.maxHp - BLOATLORD_CONTACT_DAMAGE);
  });

  it("transitions to Victory when the Boss's HP reaches 0", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.boss = createBoss(0, 0); // far from the bunny — isolates the death check
    state.boss.hp = 0;

    step(state, NO_INPUT, 0);

    expect(state.phase).toBe("Victory");
  });

  it("freezes the simulation once in Victory — no further enemy spawns", () => {
    const state = createInitialState(1);
    state.phase = "Victory";
    state.waveSpawnSchedule = [0]; // due immediately, if spawning still ran

    step(state, NO_INPUT, 1);

    let activeCount = 0;
    state.enemies.forEachActive(() => {
      activeCount += 1;
    });
    expect(activeCount).toBe(0);
  });

  it("summons 4 Shamblers on its Summon cooldown in Phase 1", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.boss = createBoss(0, 0); // far away, so Contact/Ground-Pound don't interfere
    state.boss.summon.cooldownRemaining = 0;

    step(state, NO_INPUT, 0); // triggers the Summon telegraph
    step(state, NO_INPUT, BOSS_TELEGRAPH_SECONDS + 0.01); // telegraph lands

    let count = 0;
    state.enemies.forEachActive(() => {
      count += 1;
    });
    expect(count).toBe(4);
  });

  it("switches to Phase 2 at 50% HP: faster, and summons Shamblers + a Spitter", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    state.boss = createBoss(0, 0);
    state.boss.hp = state.boss.maxHp / 2; // exactly the Phase 2 threshold
    state.boss.summon.cooldownRemaining = 0;
    const startX = state.boss.x;

    step(state, NO_INPUT, 0); // triggers the Summon telegraph, sets Phase 2
    step(state, NO_INPUT, BOSS_TELEGRAPH_SECONDS + 0.01); // telegraph lands

    expect(state.boss.phase).toBe(2);
    let shamblerCount = 0;
    let spitterCount = 0;
    state.enemies.forEachActive((e) => {
      if (e.ranged) spitterCount += 1;
      else shamblerCount += 1;
    });
    expect(shamblerCount).toBe(3);
    expect(spitterCount).toBe(1);
    expect(state.boss.x).not.toBe(startX); // Phase 2 is faster, but still moves
  });
});
