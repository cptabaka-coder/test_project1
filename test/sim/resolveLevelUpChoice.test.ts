import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/sim/types";
import { resolveLevelUpChoice } from "../../src/sim/levelUp";

describe("resolveLevelUpChoice", () => {
  it("applies the chosen Stat gain and resumes the Wave", () => {
    const state = createInitialState(1);
    state.phase = "LevelUp";
    state.pendingLevelUpOptions = [{ id: "armor", label: "+5 Armor", amount: 5 }];

    resolveLevelUpChoice(state, state.pendingLevelUpOptions[0]!);

    expect(state.bunny.stats.armor).toBe(5);
    expect(state.phase).toBe("Wave");
    expect(state.pendingLevelUpOptions).toEqual([]);
  });

  it("also heals the bunny when the choice is +1 Max HP", () => {
    const state = createInitialState(1);
    state.phase = "LevelUp";
    const startHp = state.bunny.hp;
    const startMaxHp = state.bunny.maxHp;

    resolveLevelUpChoice(state, { id: "maxHp", label: "+1 Max HP", amount: 1 });

    expect(state.bunny.maxHp).toBe(startMaxHp + 1);
    expect(state.bunny.hp).toBe(startHp + 1);
  });
});
