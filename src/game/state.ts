import type { RunPhase } from "../sim/types";

/**
 * Run phase machine. No-op stub for issue #1 — the real transitions (and their
 * guards) are wired by issues #5 (death), #9 (level-up), #10 (shop), #12
 * (victory) and #13 (menu / restart). See docs/design/vertical-slice.md §2.
 */
export function transition(_from: RunPhase, to: RunPhase): RunPhase {
  return to;
}
