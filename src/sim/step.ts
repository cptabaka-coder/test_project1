import {
  ARENA_MARGIN,
  BUNNY_IFRAME_SECONDS,
  BUNNY_MOVE_SPEED,
  FIXED_DT,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SHAMBLER_CONTACT_DAMAGE,
  SHAMBLER_HP,
  SHAMBLER_RADIUS,
  SHAMBLER_SPEED,
} from "../data/constants";
import { transition } from "./state";
import type { FrameInputs, GameState } from "./types";
import { drainDueSpawns, pickSpawnPosition } from "./waveDirector";

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
  if (state.phase === "GameOver") {
    state.tick += 1;
    return state;
  }

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

  state.waveElapsedSeconds += dt;
  drainDueSpawns(state.waveSpawnSchedule, state.waveElapsedSeconds, () => {
    const spawned = state.enemies.spawn((enemy) => {
      const pos = pickSpawnPosition(state.rng);
      enemy.x = pos.x;
      enemy.y = pos.y;
      enemy.radius = SHAMBLER_RADIUS;
      enemy.hp = SHAMBLER_HP;
      enemy.speed = SHAMBLER_SPEED;
      enemy.contactDamage = SHAMBLER_CONTACT_DAMAGE;
    });
    return spawned !== undefined;
  });

  state.enemies.forEachActive((enemy) => {
    const dx = state.bunny.x - enemy.x;
    const dy = state.bunny.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;
    enemy.x += (dx / distance) * enemy.speed * dt;
    enemy.y += (dy / distance) * enemy.speed * dt;
  });

  state.bunny.iframeSeconds = Math.max(0, state.bunny.iframeSeconds - dt);

  if (state.bunny.iframeSeconds <= 0) {
    state.enemies.forEachActive((enemy) => {
      if (state.bunny.iframeSeconds > 0) return; // already hit this tick
      const dx = enemy.x - state.bunny.x;
      const dy = enemy.y - state.bunny.y;
      const touchRange = enemy.radius + state.bunny.radius;
      if (dx * dx + dy * dy <= touchRange * touchRange) {
        state.bunny.hp -= enemy.contactDamage;
        state.bunny.iframeSeconds = BUNNY_IFRAME_SECONDS;
      }
    });
  }

  if (state.bunny.hp <= 0) {
    state.phase = transition(state.phase, "GameOver");
  }

  state.tick += 1;
  return state;
}
