import {
  BUNNY_MAX_HP,
  BUNNY_RADIUS,
  CAP_ENEMIES,
  CAP_PICKUPS,
  CAP_PROJECTILES,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SHOP_OFFER_COUNT,
  WEAPON_SLOT_COUNT,
} from "../data/constants";
import type { WeaknessDef } from "../data/enemies";
import type { ItemDef } from "../data/items";
import type { StatGainOption } from "../data/levelUpPool";
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
  /** What was paid for the Weapon at its current Level — the Sell-back base
   * (design spec §9). 0 for the un-bought starting Knife. */
  purchasePrice: number;
}

function createWeaponSlots(): WeaponSlot[] {
  const slots: WeaponSlot[] = Array.from({ length: WEAPON_SLOT_COUNT }, () => ({
    weapon: undefined,
    level: 1,
    cooldownSeconds: 0,
    purchasePrice: 0,
  }));
  slots[0] = { weapon: KNIFE, level: 1, cooldownSeconds: 0, purchasePrice: 0 }; // starting loadout (design spec §3)
  return slots;
}

/** A Shop offer slot (design spec §9): a Weapon or an Item (design spec §10). */
export type ShopOffer =
  | { kind: "weapon"; weapon: WeaponDef; level: number; price: number }
  | { kind: "item"; item: ItemDef; price: number };

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
  /** Spendable Carrot balance (design spec §8-9): rises on collection, falls
   * when the Shop is used. */
  carrots: number;
  /** Total Carrots ever collected — the Level's XP (design spec §8). Never
   * decreases, so spending never "un-levels" the bunny. */
  totalCarrotsEarned: number;
  level: number;
  /** How many of each Item (by id) the bunny owns (design spec §10) — Items
   * are passive and stackable, never occupying a Weapon Slot. */
  itemCounts: Record<string, number>;
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
  /** This enemy type's bonus-damage matchup, if any (design spec §6). */
  weakness: WeaknessDef | undefined;
  /** Elites drop more Carrots on death (design spec §8). Nothing spawns an
   * Elite yet — this just makes the drop-amount rule correct once one does. */
  isElite: boolean;
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
    weakness: undefined,
    isElite: false,
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
  enemy.weakness = undefined;
  enemy.isElite = false;
}

/** A dropped Carrot (design spec §8): sits still until the bunny is within
 * Pickup Range, then flies to it and is collected on contact. */
export interface Carrot {
  x: number;
  y: number;
  radius: number;
  value: number;
}

function createCarrot(): Carrot {
  return { x: 0, y: 0, radius: 0, value: 0 };
}

function resetCarrot(carrot: Carrot): void {
  carrot.x = 0;
  carrot.y = 0;
  carrot.radius = 0;
  carrot.value = 0;
}

/** A lobbed AoE shot's splash (the Plasma Cannon — design spec §5): detonates
 * where it lands, dealing `damage` (direct) to the closest enemy plus falloff
 * splash to everyone within `splashRadius`. */
export interface AoeState {
  splashRadius: number;
  splashDamage: number;
  familyStat: number;
  globalDamagePercent: number;
  weaponFamily: string;
  weaponId: string;
}

/** A fired shot (Spitter's spit, Stalker's blood-bolt, the Plasma Cannon's lob
 * — design spec §5-6). Travels in a straight line; an enemy shot damages the
 * bunny on contact, a bunny shot with `aoe` set detonates when its `ttlSeconds`
 * (its travel time) elapses. */
export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  /** Seconds left before the shot expires unfired-and-forgotten (a miss) — or,
   * for an `aoe` shot, before it lands and detonates. */
  ttlSeconds: number;
  /** % of this shot's damage, if it lands, returned to the firer as HP. */
  lifestealPercent: number;
  /** The firing enemy, so a lifesteal-landing hit can heal it back. May have
   * despawned (and its pooled slot reused) by the time the shot lands — callers
   * must check `enemies.isActive(owner)` before crediting the heal. */
  owner: Enemy | undefined;
  firedBy: "enemy" | "bunny";
  /** Set only for a lobbed AoE shot; undefined for a direct-hit shot. */
  aoe: AoeState | undefined;
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
    firedBy: "enemy",
    aoe: undefined,
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
  projectile.firedBy = "enemy";
  projectile.aoe = undefined;
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
  pickups: EntityStore<Carrot>;
  /** The current Wave number (design spec §7). Only Wave 1 is reachable so far (issue #7). */
  wave: number;
  /** Remaining Wave-1 spawn timestamps, seconds from Wave start (design spec §7). */
  waveSpawnSchedule: number[];
  /** Seconds elapsed in the current Wave. */
  waveElapsedSeconds: number;
  /** The rolled 1-of-3 choices while `phase === "LevelUp"`; empty otherwise. */
  pendingLevelUpOptions: StatGainOption[];
  /** The Shop's 4 offer slots (design spec §9); undefined = empty slot. */
  shopOffers: (ShopOffer | undefined)[];
  /** Parallel to `shopOffers`: true keeps that slot through the next Reroll. */
  shopLocked: boolean[];
  /** Rerolls used since the Shop last reset for a Wave. */
  shopRerollUses: number;
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
      carrots: 0,
      totalCarrotsEarned: 0,
      level: 1,
      itemCounts: {},
    },
    enemies: createEntityStore(CAP_ENEMIES, createEnemy, resetEnemy),
    projectiles: createEntityStore(CAP_PROJECTILES, createProjectile, resetProjectile),
    pickups: createEntityStore(CAP_PICKUPS, createCarrot, resetCarrot),
    wave: 1,
    waveSpawnSchedule: generateWaveBudget(1, rng),
    waveElapsedSeconds: 0,
    pendingLevelUpOptions: [],
    shopOffers: Array.from({ length: SHOP_OFFER_COUNT }, () => undefined),
    shopLocked: Array.from({ length: SHOP_OFFER_COUNT }, () => false),
    shopRerollUses: 0,
  };
}

export const NO_INPUT: FrameInputs = { moveX: 0, moveY: 0 };
