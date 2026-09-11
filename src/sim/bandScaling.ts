/**
 * The Band system's per-Wave scaling (design spec §6, ADR 0003): HP and
 * Contact Damage compound +12% per Wave past Wave 1. Difficulty is a
 * function of the Wave number alone — never of player power.
 */
const SCALING_PER_WAVE = 0.12;

export function bandMultiplier(wave: number): number {
  return Math.pow(1 + SCALING_PER_WAVE, wave - 1);
}

export function scaledHp(baseHp: number, wave: number): number {
  return baseHp * bandMultiplier(wave);
}

export function scaledContactDamage(baseContactDamage: number, wave: number): number {
  return baseContactDamage * bandMultiplier(wave);
}
