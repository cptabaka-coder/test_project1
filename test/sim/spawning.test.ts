import { describe, expect, it } from "vitest";
import {
  SHAMBLER_CONTACT_DAMAGE,
  SHAMBLER_HP,
  SHAMBLER_SPEED,
} from "../../src/data/constants";
import { createInitialState, NO_INPUT } from "../../src/sim/types";
import { step } from "../../src/sim/step";

describe("step", () => {
  it("spawns a Shambler once its scheduled time arrives", () => {
    const state = createInitialState(1);
    state.waveSpawnSchedule = [0]; // due immediately

    step(state, NO_INPUT, 0);

    const seen: { hp: number; speed: number; contactDamage: number }[] = [];
    state.enemies.forEachActive((e) => seen.push(e));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      hp: SHAMBLER_HP,
      speed: SHAMBLER_SPEED,
      contactDamage: SHAMBLER_CONTACT_DAMAGE,
    });
    expect(state.waveSpawnSchedule).toEqual([]);
  });
});
