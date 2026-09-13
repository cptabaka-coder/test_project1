import { describe, expect, it } from "vitest";
import { BOSS_TELEGRAPH_SECONDS, GROUND_POUND_DAMAGE } from "../../src/data/boss";
import { createBoss } from "../../src/sim/boss";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

function spawnBossOnBunny(state: ReturnType<typeof createInitialState>) {
  // 80px away: outside Contact range (radii sum ~38px) so only Ground-Pound's
  // AoE (130px) can land a hit here, isolating it from Contact damage.
  state.boss = createBoss(state.bunny.x + 80, state.bunny.y);
  state.boss.groundPound.cooldownRemaining = 0; // ready to fire immediately
}

describe("step", () => {
  it("deals no Ground-Pound damage while the attack is still telegraphing", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    spawnBossOnBunny(state);

    step(state, NO_INPUT, 0); // triggers the telegraph this tick
    expect(state.boss!.groundPound.telegraphRemaining).toBeGreaterThan(0);

    step(state, NO_INPUT, BOSS_TELEGRAPH_SECONDS / 2); // still mid-telegraph

    expect(state.bunny.hp).toBe(state.bunny.maxHp); // no damage yet
  });

  it("lands Ground-Pound's damage once the telegraph completes", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [];
    spawnBossOnBunny(state);

    step(state, NO_INPUT, 0); // triggers the telegraph
    step(state, NO_INPUT, BOSS_TELEGRAPH_SECONDS + 0.01); // telegraph fully elapses

    expect(state.bunny.hp).toBe(state.bunny.maxHp - GROUND_POUND_DAMAGE);
  });
});
