import type { StatGainOption } from "../data/levelUpPool";
import { transition } from "./state";
import type { GameState } from "./types";

/**
 * Applies the player's 1-of-3 Level-Up pick and resumes the Wave (design
 * spec §8). `+1 Max HP` also heals the bunny by the same amount.
 */
export function resolveLevelUpChoice(state: GameState, choice: StatGainOption): void {
  state.bunny.stats[choice.id] += choice.amount;
  if (choice.id === "maxHp") {
    state.bunny.maxHp += choice.amount;
    state.bunny.hp += choice.amount;
  }

  state.pendingLevelUpOptions = [];
  state.phase = transition(state.phase, "Wave");
}
