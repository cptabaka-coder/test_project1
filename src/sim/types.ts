import { Rng } from "./rng";

/** The six Run phases (design spec §2). Transitions are wired by later issues. */
export type RunPhase =
  | "Menu"
  | "Wave"
  | "Shop"
  | "LevelUp"
  | "GameOver"
  | "Victory";

/** Everything the simulation needs to advance one fixed step. */
export interface GameState {
  phase: RunPhase;
  /** The Run's only source of randomness (ADR 0002). */
  rng: Rng;
  /** Fixed-step ticks elapsed in the current Run. */
  tick: number;
}

/** Per-frame player intent, sampled by the loop and handed to `step`. */
export interface FrameInputs {
  /** Normalised movement, each component in [-1, 1]. */
  moveX: number;
  moveY: number;
}

export function createInitialState(seed: number): GameState {
  return { phase: "Menu", rng: new Rng(seed), tick: 0 };
}

export const NO_INPUT: FrameInputs = { moveX: 0, moveY: 0 };
