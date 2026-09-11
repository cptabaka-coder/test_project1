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

/** The bunny's HP pool and post-hit invulnerability window (design spec §3). */
export const BUNNY_MAX_HP = 12;
export const BUNNY_IFRAME_SECONDS = 0.3;

/** Shambler stats at Wave 1, base Band values (design spec §6). */
export const SHAMBLER_HP = 10;
export const SHAMBLER_SPEED = 45;
export const SHAMBLER_CONTACT_DAMAGE = 3;
export const SHAMBLER_RADIUS = 10;

/** Wave 1: gentle intro, Shamblers only (design spec §7). */
export const WAVE_1_DURATION_S = 20;
export const WAVE_1_SHAMBLER_COUNT = 18;

/** How far outside the wall an enemy first appears (design spec §7: "just outside the Arena"). */
export const ENEMY_SPAWN_OFFSET = 16;

/** The bunny's carrying positions for Weapons (design spec §5). */
export const WEAPON_SLOT_COUNT = 6;

/** A fired shot despawns (a miss) if it hasn't hit anything by then. */
export const PROJECTILE_TTL_SECONDS = 3;
export const PROJECTILE_RADIUS = 4;
