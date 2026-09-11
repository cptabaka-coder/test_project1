/**
 * The Level curve (design spec §8): Level 2 at 8 Carrots collected, then the
 * threshold compounds x1.5 per Level after.
 */
const LEVEL_2_THRESHOLD = 8;
const LEVEL_SCALING = 1.5;

/** Total Carrots collected needed to reach `level` (level >= 2). */
export function carrotThresholdForLevel(level: number): number {
  return LEVEL_2_THRESHOLD * Math.pow(LEVEL_SCALING, level - 2);
}

/** The bunny's current Level for a running total of Carrots collected. */
export function levelForCarrots(carrots: number): number {
  let level = 1;
  while (carrots >= carrotThresholdForLevel(level + 1)) level++;
  return level;
}
