export interface AccumulatorResult {
  /** How many fixed simulation steps to run this frame. */
  steps: number;
  /** Real time (ms) carried over to the next frame, always < fixedDtMs. */
  accumMs: number;
  /** Fraction of a step the carry-over represents, in [0, 1), for render interpolation. */
  alpha: number;
}

/**
 * Pure core of the fixed-timestep loop (ADR 0002).
 *
 * Given the leftover time from last frame and how long this frame took, decide
 * how many fixed steps of `fixedDtMs` to run, and how much time is left over.
 */
export function drainAccumulator(
  accumMs: number,
  frameDeltaMs: number,
  fixedDtMs: number,
  maxSteps: number,
): AccumulatorResult {
  const acc = accumMs + frameDeltaMs;
  const wanted = Math.floor(acc / fixedDtMs);

  if (wanted > maxSteps) {
    // Spiral-of-death guard: run at most maxSteps and drop the unsimulated
    // time rather than banking it, so a stall does not compound next frame.
    const rest = acc % fixedDtMs;
    return { steps: maxSteps, accumMs: rest, alpha: rest / fixedDtMs };
  }

  const rest = acc - wanted * fixedDtMs;
  return { steps: wanted, accumMs: rest, alpha: rest / fixedDtMs };
}
