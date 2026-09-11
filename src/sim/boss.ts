import { BOSS_TELEGRAPH_SECONDS } from "../data/boss";
import type { TelegraphedAttack } from "./types";

/**
 * The Bloatlord (design spec §6 Boss, Wave 5): a Zombie with two Phases
 * split at 50% HP, the second faster and with an added attack.
 */
export function bossPhaseForHp(hp: number, maxHp: number): 1 | 2 {
  return hp <= maxHp / 2 ? 2 : 1;
}

/**
 * Advances one attack's cooldown/telegraph by `dt` (design spec §6: "every
 * attack Telegraphed with a white flash + scale-up ... before it lands").
 * Returns true on exactly the tick the attack lands.
 */
export function tickTelegraph(attack: TelegraphedAttack, dt: number): boolean {
  if (attack.telegraphRemaining > 0) {
    attack.telegraphRemaining = Math.max(0, attack.telegraphRemaining - dt);
    return attack.telegraphRemaining <= 0;
  }

  attack.cooldownRemaining = Math.max(0, attack.cooldownRemaining - dt);
  if (attack.cooldownRemaining <= 0) {
    attack.telegraphRemaining = BOSS_TELEGRAPH_SECONDS;
    attack.cooldownRemaining = attack.cooldownSeconds;
  }
  return false;
}
