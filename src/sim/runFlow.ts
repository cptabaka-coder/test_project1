import { LOGICAL_WIDTH, ARENA_MARGIN } from "../data/constants";
import { createBoss } from "./boss";
import { transition } from "./state";
import type { GameState } from "./types";
import { generateWaveBudget } from "./waveDirector";

/** Menu -> Wave: begins Wave 1 (design spec §2's state machine). */
export function startRun(state: GameState): void {
  state.phase = transition(state.phase, "Wave");
}

/**
 * Shop -> next Wave (design spec §2, §7): advances the Wave counter, rolls a
 * fresh spawn schedule, and resumes. Wave 5 has no schedule of its own — it
 * spawns the Boss instead (design spec §6).
 */
export function continueToNextWave(state: GameState): void {
  state.wave += 1;
  state.waveElapsedSeconds = 0;
  state.waveSpawnSchedule = generateWaveBudget(state.wave, state.rng);

  if (state.wave === 5) {
    state.boss = createBoss(LOGICAL_WIDTH / 2, ARENA_MARGIN * 2);
  }

  state.phase = transition(state.phase, "Wave");
}
