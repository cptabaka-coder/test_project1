/**
 * Shared constants. `src/data` is pure — no rendering, no DOM, no wall-clock —
 * so both the simulation and the renderer can read the same numbers.
 */

/** Fixed logical stage. All gameplay coordinates are in this space. */
export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;

/** Wall inset from the logical edge; enemies spawn just outside the Arena. */
export const ARENA_MARGIN = 32;

/** Simulation runs at a fixed rate (ADR 0002). */
export const FIXED_HZ = 60;
export const FIXED_DT = 1 / FIXED_HZ;

/** Entity caps (design spec §2). Overflow is queued / vacuumed, never dropped silently. */
export const CAP_ENEMIES = 400;
export const CAP_PROJECTILES = 300;
export const CAP_PICKUPS = 200;
