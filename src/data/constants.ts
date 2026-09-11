/**
 * Shared constants. `src/data` is pure — no rendering, no DOM, no wall-clock —
 * so both the simulation and the renderer can read the same numbers.
 */

/** Fixed logical stage. All gameplay coordinates are in this space. */
export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;

/** Wall inset from the logical edge; enemies spawn just outside the Arena. */
export const ARENA_MARGIN = 32;

/** The bunny's move speed, 8-way (design spec §3). */
export const BUNNY_MOVE_SPEED = 100;

/** The bunny's small forgiving hitbox radius (design spec §3). */
export const BUNNY_RADIUS = 10;

/** Simulation runs at a fixed rate (ADR 0002). */
export const FIXED_HZ = 60;
export const FIXED_DT = 1 / FIXED_HZ;

/** Entity caps (design spec §2). Overflow is queued / vacuumed, never dropped silently. */
export const CAP_ENEMIES = 400;
export const CAP_PROJECTILES = 300;
export const CAP_PICKUPS = 200;
