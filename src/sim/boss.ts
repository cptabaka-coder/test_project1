import {
  BLOATLORD_CONTACT_DAMAGE,
  BLOATLORD_HP,
  BLOATLORD_RADIUS,
  BLOATLORD_SPEED_PHASE_1,
  BLOATLORD_SPEED_PHASE_2_MULTIPLIER,
  BOSS_TELEGRAPH_SECONDS,
  GROUND_POUND_COOLDOWN_PHASE_1,
  GROUND_POUND_COOLDOWN_PHASE_2,
  SPORE_BURST_CLOUD_COUNT,
  SPORE_BURST_CLOUD_DAMAGE_PER_SECOND,
  SPORE_BURST_CLOUD_DURATION_SECONDS,
  SPORE_BURST_CLOUD_RADIUS,
  SPORE_BURST_COOLDOWN_SECONDS,
  SPORE_BURST_LOB_RANGE,
  SUMMON_COOLDOWN_SECONDS,
  SUMMON_COUNT_PHASE_1,
  SUMMON_SHAMBLER_COUNT_PHASE_2,
  SUMMON_SPITTER_COUNT_PHASE_2,
} from "../data/boss";
import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SHAMBLER_CONTACT_DAMAGE,
  SHAMBLER_HP,
  SHAMBLER_RADIUS,
  SHAMBLER_SPEED,
} from "../data/constants";
import { SPITTER } from "../data/enemies";
import { initEnemyFromBand } from "./enemyFromBand";
import type { EntityStore } from "./entityStore";
import type { Rng } from "./rng";
import type { Enemy, SporeCloud } from "./types";
import { pickSpawnPosition } from "./waveDirector";

/** A Boss attack's cooldown + telegraph timing, shared by Ground-Pound,
 * Summon and Spore Burst (design spec §6: "every attack Telegraphed"). */
export interface TelegraphedAttack {
  cooldownSeconds: number;
  cooldownRemaining: number;
  /** > 0 while winding up; the attack lands the tick this reaches 0. */
  telegraphRemaining: number;
}

function createTelegraphedAttack(cooldownSeconds: number): TelegraphedAttack {
  return { cooldownSeconds, cooldownRemaining: 0, telegraphRemaining: 0 };
}

/** The Bloatlord (design spec §6 Boss, Wave 5). A singleton — undefined until spawned. */
export interface Boss {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2;
  contactDamage: number;
  groundPound: TelegraphedAttack;
  summon: TelegraphedAttack;
  /** Only ticks/fires in Phase 2. */
  sporeBurst: TelegraphedAttack;
}

/** Builds a fresh Bloatlord (design spec §6, Wave 5) at full HP, Phase 1. */
export function createBoss(x: number, y: number): Boss {
  return {
    x,
    y,
    radius: BLOATLORD_RADIUS,
    hp: BLOATLORD_HP,
    maxHp: BLOATLORD_HP,
    phase: 1,
    contactDamage: BLOATLORD_CONTACT_DAMAGE,
    groundPound: createTelegraphedAttack(GROUND_POUND_COOLDOWN_PHASE_1),
    summon: createTelegraphedAttack(SUMMON_COOLDOWN_SECONDS),
    sporeBurst: createTelegraphedAttack(SPORE_BURST_COOLDOWN_SECONDS),
  };
}

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

/**
 * Advances the Bloatlord by one tick: Phase transition, movement (holding
 * still mid wind-up), and its three Telegraphed attacks — Ground Pound,
 * Summon, and (Phase 2 only) Spore Burst (design spec §6). Returns true on
 * exactly the tick a Ground Pound lands, for the bunny-damage check in `step`.
 */
export function tickBoss(
  boss: Boss,
  bunny: { x: number; y: number },
  enemies: EntityStore<Enemy>,
  sporeClouds: EntityStore<SporeCloud>,
  wave: number,
  rng: Rng,
  dt: number,
): boolean {
  const wasPhase1 = boss.phase === 1;
  boss.phase = bossPhaseForHp(boss.hp, boss.maxHp);
  if (wasPhase1 && boss.phase === 2) {
    boss.groundPound.cooldownSeconds = GROUND_POUND_COOLDOWN_PHASE_2;
  }

  const speed =
    BLOATLORD_SPEED_PHASE_1 * (boss.phase === 2 ? BLOATLORD_SPEED_PHASE_2_MULTIPLIER : 1);
  const bdx = bunny.x - boss.x;
  const bdy = bunny.y - boss.y;
  const bdistance = Math.hypot(bdx, bdy);
  // Stands still mid wind-up (design spec §6: "avoided by spacing").
  if (bdistance !== 0 && boss.groundPound.telegraphRemaining <= 0) {
    boss.x += (bdx / bdistance) * speed * dt;
    boss.y += (bdy / bdistance) * speed * dt;
  }
  const bossMinX = boss.radius;
  const bossMaxX = LOGICAL_WIDTH - boss.radius;
  if (boss.x > bossMaxX) boss.x = bossMaxX;
  else if (boss.x < bossMinX) boss.x = bossMinX;
  const bossMinY = boss.radius;
  const bossMaxY = LOGICAL_HEIGHT - boss.radius;
  if (boss.y > bossMaxY) boss.y = bossMaxY;
  else if (boss.y < bossMinY) boss.y = bossMinY;

  const groundPoundLanded = tickTelegraph(boss.groundPound, dt);

  if (tickTelegraph(boss.summon, dt)) {
    const shamblerCount = boss.phase === 1 ? SUMMON_COUNT_PHASE_1 : SUMMON_SHAMBLER_COUNT_PHASE_2;
    for (let i = 0; i < shamblerCount; i++) {
      enemies.spawn((enemy) => {
        const pos = pickSpawnPosition(rng);
        enemy.x = pos.x;
        enemy.y = pos.y;
        enemy.radius = SHAMBLER_RADIUS;
        enemy.hp = SHAMBLER_HP;
        enemy.maxHp = SHAMBLER_HP;
        enemy.speed = SHAMBLER_SPEED;
        enemy.contactDamage = SHAMBLER_CONTACT_DAMAGE;
        enemy.weakness = { against: "Plasma", multiplier: 1.3 };
      });
    }
    if (boss.phase === 2) {
      for (let i = 0; i < SUMMON_SPITTER_COUNT_PHASE_2; i++) {
        const pos = pickSpawnPosition(rng);
        enemies.spawn((enemy) => initEnemyFromBand(enemy, SPITTER, wave, pos.x, pos.y));
      }
    }
  }

  if (boss.phase === 2 && tickTelegraph(boss.sporeBurst, dt)) {
    for (let i = 0; i < SPORE_BURST_CLOUD_COUNT; i++) {
      const angle = rng.next() * Math.PI * 2;
      const lobDistance = rng.next() * SPORE_BURST_LOB_RANGE;
      sporeClouds.spawn((cloud) => {
        cloud.x = bunny.x + Math.cos(angle) * lobDistance;
        cloud.y = bunny.y + Math.sin(angle) * lobDistance;
        cloud.radius = SPORE_BURST_CLOUD_RADIUS;
        cloud.damagePerSecond = SPORE_BURST_CLOUD_DAMAGE_PER_SECOND;
        cloud.secondsRemaining = SPORE_BURST_CLOUD_DURATION_SECONDS;
      });
    }
  }

  return groundPoundLanded;
}
