import {
  BUNNY_MAX_HP,
  BUNNY_RADIUS,
  CAP_ENEMIES,
  CAP_PROJECTILES,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  WEAPON_SLOT_COUNT,
} from "../data/constants";
import { KNIFE, type WeaponDef } from "../data/weapons";
import { createEntityStore, type EntityStore } from "./entityStore";
import { generateWaveBudget } from "./waveDirector";
import { Rng } from "./rng";

/** The six Run phases (design spec §2). Transitions are wired by later issues. */
export type RunPhase =
  | "Menu"
  | "Wave"
  | "Shop"
  | "LevelUp"
  | "GameOver"
  | "Victory";

/**
 * The bunny's named modifiers (design spec §4). Items and Level-Ups (issues
 * #9-#11) adjust these; Weapons and the damage pipeline read them. All start
 * at 0 — no bonus — until then.
 */
export interface Stats {
  maxHp: number;
  hpRegen: number;
  lifestealPercent: number;
  damagePercent: number;
  meleeDamage: number;
  energyDamage: number;
  explosiveDamage: number;
  attackSpeedPercent: number;
  critChancePercent: number;
  armor: number;
  dodgePercent: number;
  moveSpeedPercent: number;
  pickupRange: number;
  luck: number;
  harvesting: number;
}

function createDefaultStats(): Stats {
  return {
    maxHp: 0,
    hpRegen: 0,
    lifestealPercent: 0,
    damagePercent: 0,
    meleeDamage: 0,
    energyDamage: 0,
    explosiveDamage: 0,
    attackSpeedPercent: 0,
    critChancePercent: 0,
    armor: 0,
    dodgePercent: 0,
    moveSpeedPercent: 0,
    pickupRange: 0,
    luck: 0,
    harvesting: 0,
  };
}

/** One of the bunny's six carrying positions (design spec §5). Empty until a Weapon is bought. */
export interface WeaponSlot {
  weapon: WeaponDef | undefined;
  level: number;
  /** Seconds remaining until this Weapon can fire again. */
  cooldownSeconds: number;
}

function createWeaponSlots(): WeaponSlot[] {
  const slots: WeaponSlot[] = Array.from({ length: WEAPON_SLOT_COUNT }, () => ({
    weapon: undefined,
    level: 1,
    cooldownSeconds: 0,
  }));
  slots[0] = { weapon: KNIFE, level: 1, cooldownSeconds: 0 }; // starting loadout (design spec §3)
  return slots;
}

/** The player-controlled bunny (design spec §3). */
export interface Bunny {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  /** Seconds of remaining post-hit invulnerability (design spec §3). */
  iframeSeconds: number;
  stats: Stats;
  weaponSlots: WeaponSlot[];
}

/** A ranged attack's tuning plus its own firing cooldown (design spec §6: Spitter, Stalker). */
export interface RangedAttackState {
  damage: number;
  projectileSpeed: number;
  /** The enemy holds at this distance and fires, rather than closing to melee. */
  range: number;
  cooldownSeconds: number;
  cooldownRemaining: number;
}

/** A periodic speed burst toward the bunny (Fledgling — design spec §6). */
export interface DashState {
  speedMultiplier: number;
  durationSeconds: number;
  cooldownSeconds: number;
  cooldownRemaining: number;
  /** > 0 while the burst is active; movement speed is `speed * speedMultiplier` then. */
  activeSecondsRemaining: number;
}

/** An undead-rabbit enemy (design spec §6). */
export interface Enemy {
  x: number;
  y: number;
  radius: number;
  hp: number;
  /** Caps Lifesteal healing (design spec §6: Fledgling, Stalker). */
  maxHp: number;
  speed: number;
  contactDamage: number;
  /** Flying enemies (the Stalker) ignore the Arena's walls/cover (design spec §6). */
  flies: boolean;
  /** % of damage dealt to the bunny returned as HP (Fledgling, Stalker — design spec §6). */
  lifestealPercent: number;
  /** Present for ranged attackers (Spitter, Stalker); undefined for melee-only enemies. */
  ranged: RangedAttackState | undefined;
  /** Present for the Fledgling; undefined for enemies that don't dash. */
  dash: DashState | undefined;
}

function createEnemy(): Enemy {
  return {
    x: 0,
    y: 0,
    radius: 0,
    hp: 0,
    maxHp: 0,
    speed: 0,
    contactDamage: 0,
    flies: false,
    lifestealPercent: 0,
    ranged: undefined,
    dash: undefined,
  };
}

function resetEnemy(enemy: Enemy): void {
  enemy.x = 0;
  enemy.y = 0;
  enemy.radius = 0;
  enemy.hp = 0;
  enemy.maxHp = 0;
  enemy.speed = 0;
  enemy.contactDamage = 0;
  enemy.flies = false;
  enemy.lifestealPercent = 0;
  enemy.ranged = undefined;
  enemy.dash = undefined;
}

/** A fired shot (Spitter's spit, Stalker's blood-bolt — design spec §6). Travels in a
 * straight line and damages the bunny on contact. */
export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  /** Seconds left before the shot expires unfired-and-forgotten (a miss). */
  ttlSeconds: number;
  /** % of this shot's damage, if it lands, returned to the firer as HP. */
  lifestealPercent: number;
  /** The firing enemy, so a lifesteal-landing hit can heal it back. May have
   * despawned (and its pooled slot reused) by the time the shot lands — callers
   * must check `enemies.isActive(owner)` before crediting the heal. */
  owner: Enemy | undefined;
}

function createProjectile(): Projectile {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 0,
    damage: 0,
    ttlSeconds: 0,
    lifestealPercent: 0,
    owner: undefined,
  };
}

function resetProjectile(projectile: Projectile): void {
  projectile.x = 0;
  projectile.y = 0;
  projectile.vx = 0;
  projectile.vy = 0;
  projectile.radius = 0;
  projectile.damage = 0;
  projectile.ttlSeconds = 0;
  projectile.lifestealPercent = 0;
  projectile.owner = undefined;
}

/** Everything the simulation needs to advance one fixed step. */
export interface GameState {
  phase: RunPhase;
  /** The Run's only source of randomness (ADR 0002). */
  rng: Rng;
  /** Fixed-step ticks elapsed in the current Run. */
  tick: number;
  bunny: Bunny;
  enemies: EntityStore<Enemy>;
  projectiles: EntityStore<Projectile>;
  /** Remaining Wave-1 spawn timestamps, seconds from Wave start (design spec §7). */
  waveSpawnSchedule: number[];
  /** Seconds elapsed in the current Wave. */
  waveElapsedSeconds: number;
}

/** Per-frame player intent, sampled by the loop and handed to `step`. */
export interface FrameInputs {
  /** Normalised movement, each component in [-1, 1]. */
  moveX: number;
  moveY: number;
}

export function createInitialState(seed: number): GameState {
  const rng = new Rng(seed);
  return {
    phase: "Menu",
    rng,
    tick: 0,
    bunny: {
      x: LOGICAL_WIDTH / 2,
      y: LOGICAL_HEIGHT / 2,
      radius: BUNNY_RADIUS,
      hp: BUNNY_MAX_HP,
      maxHp: BUNNY_MAX_HP,
      iframeSeconds: 0,
      stats: createDefaultStats(),
      weaponSlots: createWeaponSlots(),
    },
    enemies: createEntityStore(CAP_ENEMIES, createEnemy, resetEnemy),
    projectiles: createEntityStore(CAP_PROJECTILES, createProjectile, resetProjectile),
    waveSpawnSchedule: generateWaveBudget(1, rng),
    waveElapsedSeconds: 0,
  };
}

export const NO_INPUT: FrameInputs = { moveX: 0, moveY: 0 };
