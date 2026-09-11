import type { StatGainOption } from "../data/levelUpPool";
import type { Rng } from "./rng";

/**
 * Rolls `count` distinct options from the Level-Up pool (design spec §8:
 * "pick 1 of 3"), via a partial Fisher-Yates shuffle on the seeded RNG.
 */
export function rollLevelUpOptions(
  pool: StatGainOption[],
  rng: Rng,
  count: number,
): StatGainOption[] {
  const shuffled = [...pool];
  const drawCount = Math.min(count, shuffled.length);

  for (let i = shuffled.length - 1; i > shuffled.length - 1 - drawCount; i--) {
    const j = rng.int(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  return shuffled.slice(shuffled.length - drawCount);
}
