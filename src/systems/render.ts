import { Container, Graphics, Particle, ParticleContainer, type Renderer, type Texture } from "pixi.js";
import { BLOATLORD_RADIUS, SPORE_BURST_CLOUD_RADIUS } from "../data/boss";
import {
  ARENA_MARGIN,
  BUNNY_RADIUS,
  CARROT_RADIUS,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SHAMBLER_RADIUS,
} from "../data/constants";
import type { EntityStore } from "../sim/entityStore";
import type { Boss, Carrot, Enemy, SporeCloud } from "../sim/types";

/**
 * Builds the static scene for issue #1: the logical stage backdrop and the
 * walled Arena. Entities, the bunny and interpolation come with later issues.
 *
 * Uses `Graphics` shapes now; textured sprites swap in later with no change to
 * the simulation (ADR 0001 / 0002).
 */
export function createArenaView(): Container {
  const view = new Container();

  const backdrop = new Graphics()
    .rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
    .fill(0x11121a);

  const arena = new Graphics()
    .rect(
      ARENA_MARGIN,
      ARENA_MARGIN,
      LOGICAL_WIDTH - ARENA_MARGIN * 2,
      LOGICAL_HEIGHT - ARENA_MARGIN * 2,
    )
    .fill(0x1b1d2b)
    .stroke({ width: 2, color: 0x3a3f5c, alignment: 1 });

  view.addChild(backdrop, arena);
  return view;
}

/**
 * Placeholder shape for the bunny (issue #4); a texture swaps in later with no
 * change to the simulation (ADR 0001 / 0002). Callers reposition it each frame
 * from `state.bunny`.
 */
export function createBunnyView(): Graphics {
  return new Graphics().circle(0, 0, BUNNY_RADIUS).fill(0xe6e6f0);
}

/**
 * Bakes a filled circle into a reusable `Texture` (issue #14: "single
 * ParticleContainer per shape/sprite type" needs every instance sharing one
 * texture). `radius` only sets the texture's resolution; on-screen size is
 * controlled by each layer's Particle scale.
 */
export function createCircleTexture(
  renderer: Renderer,
  radius: number,
  color: number,
  alpha = 1,
): Texture {
  const graphics = new Graphics().circle(radius, radius, radius).fill({ color, alpha });
  const texture = renderer.generateTexture(graphics);
  graphics.destroy();
  return texture;
}

/**
 * A ParticleContainer-backed layer for one entity kind, all rendered at a
 * single fixed radius (matching what each kind already rendered at before
 * this — issue #14's perf pass, not a visual change). Views are keyed by the
 * entity object's identity: a pooled slot reuses its existing Particle
 * across despawn/respawn, same as the plain-`Container` layers before it.
 */
export interface ParticleLayer<T> {
  container: ParticleContainer;
  sync: (store: EntityStore<T>, getX: (item: T) => number, getY: (item: T) => number) => void;
}

function createParticleLayer<T extends object>(texture: Texture): ParticleLayer<T> {
  const container = new ParticleContainer({ texture });
  const particles = new Map<T, Particle>();

  return {
    container,
    sync(store, getX, getY): void {
      const active = new Set<T>();

      store.forEachActive((item) => {
        active.add(item);
        let particle = particles.get(item);
        if (!particle) {
          particle = new Particle({ texture, anchorX: 0.5, anchorY: 0.5 });
          particles.set(item, particle);
          container.addParticle(particle);
        }
        particle.x = getX(item);
        particle.y = getY(item);
      });

      for (const [item, particle] of particles) {
        if (active.has(item)) continue;
        container.removeParticle(particle);
        particles.delete(item);
      }
    },
  };
}

export interface EnemyLayer {
  container: ParticleContainer;
  sync: (enemies: EntityStore<Enemy>) => void;
}

/** Placeholder circles for enemies (issue #5); a texture swaps in later with no change to the simulation. */
export function createEnemyLayer(renderer: Renderer): EnemyLayer {
  const texture = createCircleTexture(renderer, SHAMBLER_RADIUS, 0x8fbf5f);
  const layer = createParticleLayer<Enemy>(texture);
  return {
    container: layer.container,
    sync: (enemies) => layer.sync(enemies, (e) => e.x, (e) => e.y),
  };
}

export interface PickupLayer {
  container: ParticleContainer;
  sync: (pickups: EntityStore<Carrot>) => void;
}

/** Placeholder circles for dropped Carrots (design spec §8); a texture swaps in later with no change to the simulation. */
export function createPickupLayer(renderer: Renderer): PickupLayer {
  const texture = createCircleTexture(renderer, CARROT_RADIUS, 0xe8952c);
  const layer = createParticleLayer<Carrot>(texture);
  return {
    container: layer.container,
    sync: (pickups) => layer.sync(pickups, (c) => c.x, (c) => c.y),
  };
}

export interface SporeCloudLayer {
  container: ParticleContainer;
  sync: (clouds: EntityStore<SporeCloud>) => void;
}

/** Placeholder circles for Spore Burst's lingering hazard clouds (design spec §6, Boss Phase 2). */
export function createSporeCloudLayer(renderer: Renderer): SporeCloudLayer {
  const texture = createCircleTexture(renderer, SPORE_BURST_CLOUD_RADIUS, 0x5fbf6f, 0.35);
  const layer = createParticleLayer<SporeCloud>(texture);
  return {
    container: layer.container,
    sync: (clouds) => layer.sync(clouds, (c) => c.x, (c) => c.y),
  };
}

export interface BossView {
  view: Graphics;
  /** Repositions the view from `boss`, or hides it when `boss` is undefined. */
  sync: (boss: Boss | undefined) => void;
}

/**
 * Placeholder shape for the Bloatlord (design spec §6, Wave 5); a texture
 * swaps in later with no change to the simulation (ADR 0001 / 0002). A
 * singleton, so a plain `Graphics` shape (not a ParticleContainer, which is
 * for batching many identical instances) is the right fit.
 */
export function createBossView(): BossView {
  const view = new Graphics().circle(0, 0, BLOATLORD_RADIUS).fill(0x7a3b5e);
  view.visible = false;

  return {
    view,
    sync(boss: Boss | undefined): void {
      view.visible = boss !== undefined;
      if (boss) view.position.set(boss.x, boss.y);
    },
  };
}
