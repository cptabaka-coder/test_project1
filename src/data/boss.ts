/**
 * The Bloatlord (design spec §6 Boss, Wave 5). Numbers not given exactly in
 * the design doc (Ground-Pound/Spore-Burst radii, Spore Burst's own
 * cooldown) are reasonable placeholders, noted per field.
 */
export const BLOATLORD_HP = 450; // "~45x a Wave-5 Shambler"
export const BLOATLORD_RADIUS = 28;
export const BLOATLORD_SPEED_PHASE_1 = 30;
export const BLOATLORD_SPEED_PHASE_2_MULTIPLIER = 1.4; // "+40% move speed"
export const BLOATLORD_CONTACT_DAMAGE = 8;

/** Every Boss attack telegraphs (white flash + scale-up) before it lands. */
export const BOSS_TELEGRAPH_SECONDS = 0.8;

export const GROUND_POUND_COOLDOWN_PHASE_1 = 6;
export const GROUND_POUND_COOLDOWN_PHASE_2 = 4;
export const GROUND_POUND_DAMAGE = 12;
/** The shockwave ring's max radius; not given exactly in the design doc. */
export const GROUND_POUND_RADIUS = 130;

export const SUMMON_COOLDOWN_SECONDS = 10;
export const SUMMON_COUNT_PHASE_1 = 4; // Shamblers
export const SUMMON_SHAMBLER_COUNT_PHASE_2 = 3;
export const SUMMON_SPITTER_COUNT_PHASE_2 = 1;

/** Phase 2 only. Cooldown isn't given in the design doc — a placeholder. */
export const SPORE_BURST_COOLDOWN_SECONDS = 8;
export const SPORE_BURST_CLOUD_COUNT = 3;
export const SPORE_BURST_CLOUD_DURATION_SECONDS = 4;
export const SPORE_BURST_CLOUD_DAMAGE_PER_SECOND = 3;
/** Each cloud's radius; not given exactly in the design doc. */
export const SPORE_BURST_CLOUD_RADIUS = 45;
/** How far from the Boss a lobbed cloud can land; not given exactly. */
export const SPORE_BURST_LOB_RANGE = 200;
