import {
  ARENA_MARGIN,
  ENEMY_SPAWN_OFFSET,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  WAVE_1_DURATION_S,
  WAVE_1_SHAMBLER_COUNT,
} from "../data/constants";
import type { Rng } from "./rng";

/** Each spawn's jitter is at most this fraction of the even interval, so the
 * seed varies the rhythm without ever reordering spawns or bunching them. */
const JITTER_FRACTION = 0.15;

/**
 * Generates a Wave's spawn schedule: seconds-from-wave-start timestamps, one
 * per enemy, sorted ascending (design spec §7). Continuous pacing: an even
 * base interval nudged by seeded jitter per spawn. Only Wave 1 has real
 * content so far — later waves land with the enemy types that fill them.
 */
export function generateWaveBudget(wave: number, rng: Rng): number[] {
  if (wave !== 1) throw new Error(`no wave budget defined for wave ${wave}`);

  const interval = WAVE_1_DURATION_S / WAVE_1_SHAMBLER_COUNT;
  const maxJitter = interval * JITTER_FRACTION;

  return Array.from({ length: WAVE_1_SHAMBLER_COUNT }, (_, i) => {
    const jitter = (rng.next() * 2 - 1) * maxJitter;
    return i * interval + jitter;
  });
}

/**
 * Attempts every due spawn in order, mutating `schedule` in place. `spawn`
 * reports success (`true`) or failure (`false`, e.g. the entity store is at
 * capacity — design spec §2's "overflow queued, never dropped"). On failure,
 * draining stops and the due event stays at the front to retry next tick,
 * preserving spawn order instead of skipping ahead.
 */
export function drainDueSpawns(
  schedule: number[],
  elapsedSeconds: number,
  spawn: () => boolean,
): void {
  while (schedule.length > 0 && schedule[0]! <= elapsedSeconds) {
    if (!spawn()) return;
    schedule.shift();
  }
}

/** A random point just outside one of the Arena's four walls (design spec §7). */
export function pickSpawnPosition(rng: Rng): { x: number; y: number } {
  const innerWidth = LOGICAL_WIDTH - 2 * ARENA_MARGIN;
  const innerHeight = LOGICAL_HEIGHT - 2 * ARENA_MARGIN;
  const edge = rng.int(4);
  const along = rng.next();

  switch (edge) {
    case 0: // north
      return { x: ARENA_MARGIN + along * innerWidth, y: ARENA_MARGIN - ENEMY_SPAWN_OFFSET };
    case 1: // east
      return {
        x: LOGICAL_WIDTH - ARENA_MARGIN + ENEMY_SPAWN_OFFSET,
        y: ARENA_MARGIN + along * innerHeight,
      };
    case 2: // south
      return {
        x: ARENA_MARGIN + along * innerWidth,
        y: LOGICAL_HEIGHT - ARENA_MARGIN + ENEMY_SPAWN_OFFSET,
      };
    default: // west
      return { x: ARENA_MARGIN - ENEMY_SPAWN_OFFSET, y: ARENA_MARGIN + along * innerHeight };
  }
}
