import type { Rng } from "./rng";

/**
 * The bunny's outgoing damage pipeline and the Global formulas it composes
 * with (design spec §3-4): base -> Family stat scaling -> global Damage% ->
 * Crit (x1.5) -> target Armor/weakness.
 */
export interface DamageParams {
  baseDamage: number;
  /** The attacker's Melee/Energy/Explosive Damage stat, per the weapon's Family. */
  familyStat: number;
  /** The attacker's global Damage% stat. */
  globalDamagePercent: number;
  isCrit: boolean;
  targetArmor: number;
  /** e.g. 1.3 for Plasma vs. Zombie, 2 for Wooden Stake vs. Vampire; 1 for no matchup. */
  weaknessMultiplier: number;
}

const CRIT_MULTIPLIER = 1.5;

export function calculateDamage(params: DamageParams): number {
  let damage = (params.baseDamage + params.familyStat) * (1 + params.globalDamagePercent / 100);
  if (params.isCrit) damage *= CRIT_MULTIPLIER;
  const armorReduction = params.targetArmor / (params.targetArmor + 100);
  damage *= 1 - armorReduction;
  damage *= params.weaknessMultiplier;
  return damage;
}

/** Rolls whether an attack Crits, given the attacker's Crit Chance% stat. */
export function rollCrit(critChancePercent: number, rng: Rng): boolean {
  return rng.next() < critChancePercent / 100;
}

const DODGE_CAP_PERCENT = 60;

/** Dodge% is capped at 60 (design spec §3: "Global formulas"). */
export function capDodgeChance(dodgePercent: number): number {
  return Math.min(dodgePercent, DODGE_CAP_PERCENT);
}
