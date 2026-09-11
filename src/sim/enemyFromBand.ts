import type { EnemyBandDef } from "../data/enemies";
import { scaledContactDamage, scaledHp } from "./bandScaling";
import type { Enemy } from "./types";

/**
 * Initializes a pooled `Enemy` from a roster Band definition (design spec
 * §6) for a given Wave, applying the Band's per-Wave scaling (ADR 0003).
 */
export function initEnemyFromBand(
  enemy: Enemy,
  band: EnemyBandDef,
  wave: number,
  x: number,
  y: number,
): void {
  enemy.x = x;
  enemy.y = y;
  enemy.radius = band.radius;
  enemy.hp = scaledHp(band.hp, wave);
  enemy.maxHp = enemy.hp;
  enemy.speed = band.speed;
  enemy.contactDamage = scaledContactDamage(band.contactDamage, wave);
  enemy.flies = band.flies;
  enemy.lifestealPercent = band.lifestealPercent;
  enemy.weakness = band.weakness;
  enemy.ranged = band.ranged ? { ...band.ranged, cooldownRemaining: 0 } : undefined;
  enemy.dash = band.dash
    ? { ...band.dash, cooldownRemaining: 0, activeSecondsRemaining: 0 }
    : undefined;
}
