import type { RunPhase } from "./types";

/**
 * Run phase machine. Wired so far: death -> GameOver (issue #5). The rest
 * (level-up, shop, victory, menu/restart) land with issues #9, #10, #12, #13.
 * See docs/design/vertical-slice.md §2.
 */
export function transition(_from: RunPhase, to: RunPhase): RunPhase {
  return to;
}
