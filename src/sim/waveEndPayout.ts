/**
 * The Carrot payout awarded when a Wave ends (design spec §8): `5 + wave*3`,
 * plus the Harvesting Stat. Not wired to an actual "Wave ends" trigger yet —
 * the wave director only generates Wave 1 so far (issue #7) — but the
 * formula is ready for whichever issue advances Waves.
 */
export function waveEndPayout(wave: number, harvesting: number): number {
  return 5 + wave * 3 + harvesting;
}
