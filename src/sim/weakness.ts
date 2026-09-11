import type { WeaknessDef } from "../data/enemies";

/**
 * Resolves a target's Weakness (design spec §6) against the firing Weapon: a
 * Weakness's `against` names either a whole Weapon Family ("Plasma") or one
 * specific Weapon id ("stake") — either match applies the bonus.
 */
export function resolveWeaknessMultiplier(
  weakness: WeaknessDef | undefined,
  weaponFamily: string,
  weaponId: string,
): number {
  if (!weakness) return 1;
  if (weakness.against === weaponFamily || weakness.against === weaponId) {
    return weakness.multiplier;
  }
  return 1;
}
