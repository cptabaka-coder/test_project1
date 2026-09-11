/**
 * The enemy roster (design spec §6). Each entry is a Band: a Wave range plus
 * base (Wave-1-equivalent) stats. `src/sim/bandScaling.ts` compounds HP and
 * Contact Damage +12%/Wave (ADR 0003) from these bases for whatever Wave an
 * instance actually spawns in.
 *
 * Ranged/dash tuning (fire rate, projectile speed, dash multiplier/duration)
 * isn't specified in the design doc beyond the named damage numbers — these
 * are reasonable placeholders, not final balance.
 */
export type EnemyArchetype = "Zombie" | "Vampire";

export interface WeaknessDef {
  /** A Weapon Family ("Plasma") or a specific Weapon id ("stake"). */
  against: string;
  multiplier: number;
}

export interface RangedAttackDef {
  damage: number;
  projectileSpeed: number;
  range: number;
  cooldownSeconds: number;
}

export interface DashDef {
  speedMultiplier: number;
  durationSeconds: number;
  cooldownSeconds: number;
}

export interface EnemyBandDef {
  id: string;
  archetype: EnemyArchetype;
  bandStart: number;
  bandEnd: number;
  hp: number;
  speed: number;
  contactDamage: number;
  radius: number;
  flies: boolean;
  lifestealPercent: number;
  weakness: WeaknessDef;
  ranged?: RangedAttackDef;
  dash?: DashDef;
}

export const SPITTER: EnemyBandDef = {
  id: "spitter",
  archetype: "Zombie",
  bandStart: 3,
  bandEnd: 5,
  hp: 14,
  speed: 40,
  contactDamage: 0,
  radius: 10,
  flies: false,
  lifestealPercent: 0,
  weakness: { against: "Plasma", multiplier: 1.3 },
  ranged: { damage: 4, projectileSpeed: 180, range: 200, cooldownSeconds: 1.5 },
};

export const FLEDGLING: EnemyBandDef = {
  id: "fledgling",
  archetype: "Vampire",
  bandStart: 2,
  bandEnd: 5,
  hp: 7,
  speed: 95,
  contactDamage: 2,
  radius: 9,
  flies: false,
  lifestealPercent: 100,
  weakness: { against: "stake", multiplier: 2 },
  dash: { speedMultiplier: 2.5, durationSeconds: 0.25, cooldownSeconds: 2.5 },
};

export const STALKER: EnemyBandDef = {
  id: "stalker",
  archetype: "Vampire",
  bandStart: 4,
  bandEnd: 5,
  hp: 12,
  speed: 80,
  contactDamage: 0,
  radius: 10,
  flies: true,
  lifestealPercent: 100,
  weakness: { against: "stake", multiplier: 2 },
  ranged: { damage: 5, projectileSpeed: 220, range: 240, cooldownSeconds: 1.8 },
};
