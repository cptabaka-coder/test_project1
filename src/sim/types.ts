import { BUNNY_MAX_HP, BUNNY_RADIUS, CAP_ENEMIES, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../data/constants";
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

/** The player-controlled bunny (design spec §3). */
export interface Bunny {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  /** Seconds of remaining post-hit invulnerability (design spec §3). */
  iframeSeconds: number;
}

/** An undead-rabbit enemy (design spec §6). Only the Shambler exists so far. */
export interface Enemy {
  x: number;
  y: number;
  radius: number;
  hp: number;
  speed: number;
  contactDamage: number;
}

function createEnemy(): Enemy {
  return { x: 0, y: 0, radius: 0, hp: 0, speed: 0, contactDamage: 0 };
}

function resetEnemy(enemy: Enemy): void {
  enemy.x = 0;
  enemy.y = 0;
  enemy.radius = 0;
  enemy.hp = 0;
  enemy.speed = 0;
  enemy.contactDamage = 0;
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
    },
    enemies: createEntityStore(CAP_ENEMIES, createEnemy, resetEnemy),
    waveSpawnSchedule: generateWaveBudget(1, rng),
    waveElapsedSeconds: 0,
  };
}

export const NO_INPUT: FrameInputs = { moveX: 0, moveY: 0 };
