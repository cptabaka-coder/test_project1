import { BUNNY_IFRAME_SECONDS } from "../data/constants";

/** The attacker credited with Lifesteal (design spec §6) when its hit lands. */
export interface LifestealCredit {
  entity: { hp: number; maxHp: number };
  percent: number;
}

/**
 * Resolves one instance of damage landing on the bunny: reduces HP, opens
 * the post-hit invulnerability window (design spec §3), and — if the source
 * carries Lifesteal — heals it for a percentage of the damage dealt, capped
 * at its max HP. Callers decide whether the bunny is currently hittable
 * (`iframeSeconds <= 0`); this function always applies once called.
 */
export function resolveBunnyDamage(
  bunny: { hp: number; iframeSeconds: number },
  damage: number,
  lifesteal?: LifestealCredit,
): void {
  bunny.hp -= damage;
  bunny.iframeSeconds = BUNNY_IFRAME_SECONDS;

  if (lifesteal && lifesteal.percent > 0) {
    const healed = damage * (lifesteal.percent / 100);
    lifesteal.entity.hp = Math.min(lifesteal.entity.hp + healed, lifesteal.entity.maxHp);
  }
}
