import { FIXED_DT } from "../data/constants";
import type { FrameInputs, GameState } from "./types";

/**
 * Advance the simulation by exactly one fixed step — the single seam the whole
 * game is tested at (ADR 0002).
 *
 * Pure with respect to the outside world: no PixiJS, no DOM, no `Date.now()` /
 * `performance.now()`, all randomness through `state.rng`. It mutates and returns
 * `state`; the loop (issue #2) owns snapshotting for render interpolation.
 *
 * Stub for issue #1 — only counts ticks so the seam is exercisable. Real
 * behaviour arrives with issues #4 onward.
 */
export function step(
  state: GameState,
  _inputs: FrameInputs,
  _dt: number = FIXED_DT,
): GameState {
  state.tick += 1;
  return state;
}
