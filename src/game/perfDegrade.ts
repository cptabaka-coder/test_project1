/**
 * The degrade path's enemy-cap lever (design spec §2, issue #14): "reduce
 * particle density first, then lower the enemy cap, when frame time slips."
 * There's no particle system in this vertical slice yet, so only the second
 * lever applies. Pure decision logic — the loop supplies `isFrameSlow` (its
 * own call on measured frame time) and applies the result to the enemy
 * EntityStore's effective capacity.
 */
export interface NextEnemyCapParams {
  currentCap: number;
  /** The un-degraded cap (design spec §2: 400) — recovery never exceeds this. */
  baseCap: number;
  /** Degrading never goes below this floor. */
  floorCap: number;
  isFrameSlow: boolean;
  stepDown: number;
}

export function nextEnemyCap(params: NextEnemyCapParams): number {
  if (params.isFrameSlow) {
    return Math.max(params.floorCap, params.currentCap - params.stepDown);
  }
  return Math.min(params.baseCap, params.currentCap + params.stepDown);
}
