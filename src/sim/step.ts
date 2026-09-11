import {
  ARENA_MARGIN,
  BUNNY_MOVE_SPEED,
  FIXED_DT,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
} from "../data/constants";
import type { FrameInputs, GameState } from "./types";

/**
 * Advance the simulation by exactly one fixed step — the single seam the whole
 * game is tested at (ADR 0002).
 *
 * Pure with respect to the outside world: no PixiJS, no DOM, no `Date.now()` /
 * `performance.now()`, all randomness through `state.rng`. It mutates and returns
 * `state`; the loop (issue #2) owns snapshotting for render interpolation.
 */
export function step(
  state: GameState,
  inputs: FrameInputs,
  dt: number = FIXED_DT,
): GameState {
  const magnitude = Math.hypot(inputs.moveX, inputs.moveY);
  // Clamp to at most 1 rather than always normalizing, so a keyboard's
  // (1, 1) diagonal doesn't outrun a straight (1, 0) while a gamepad's
  // partial stick tilt still moves proportionally slower.
  const scale = magnitude > 1 ? 1 / magnitude : 1;

  state.bunny.x += inputs.moveX * scale * BUNNY_MOVE_SPEED * dt;
  state.bunny.y += inputs.moveY * scale * BUNNY_MOVE_SPEED * dt;

  const minX = ARENA_MARGIN + state.bunny.radius;
  const maxX = LOGICAL_WIDTH - ARENA_MARGIN - state.bunny.radius;
  if (state.bunny.x > maxX) state.bunny.x = maxX;
  else if (state.bunny.x < minX) state.bunny.x = minX;

  const minY = ARENA_MARGIN + state.bunny.radius;
  const maxY = LOGICAL_HEIGHT - ARENA_MARGIN - state.bunny.radius;
  if (state.bunny.y > maxY) state.bunny.y = maxY;
  else if (state.bunny.y < minY) state.bunny.y = minY;

  state.tick += 1;
  return state;
}
