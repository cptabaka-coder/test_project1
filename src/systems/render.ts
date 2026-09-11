import { Container, Graphics } from "pixi.js";
import { BLOATLORD_RADIUS } from "../data/boss";
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

export interface EnemyLayer {
  container: Container;
  /** Syncs child Graphics 1:1 with the store's active enemies, positioning
   * each from `enemy.x/y`. Views are keyed by the enemy object's identity, so
   * a pooled slot reuses its existing view across despawn/respawn. */
  sync: (enemies: EntityStore<Enemy>) => void;
}

/**
 * Placeholder shapes for enemies (issue #5); a texture swaps in later with no
 * change to the simulation (ADR 0001 / 0002).
 */
export function createEnemyLayer(): EnemyLayer {
  const container = new Container();
  const views = new Map<Enemy, Graphics>();

  return {
    container,
    sync(enemies: EntityStore<Enemy>): void {
      const active = new Set<Enemy>();

      enemies.forEachActive((enemy) => {
        active.add(enemy);
        let view = views.get(enemy);
        if (!view) {
          view = new Graphics().circle(0, 0, SHAMBLER_RADIUS).fill(0x8fbf5f);
          views.set(enemy, view);
          container.addChild(view);
        }
        view.position.set(enemy.x, enemy.y);
      });

      for (const [enemy, view] of views) {
        if (active.has(enemy)) continue;
        container.removeChild(view);
        view.destroy();
        views.delete(enemy);
      }
    },
  };
}

export interface PickupLayer {
  container: Container;
  /** Syncs child Graphics 1:1 with the store's active Carrots, positioning
   * each from `carrot.x/y`. Views are keyed by object identity, same as
   * `EnemyLayer.sync` — see its note on pooled-slot reuse. */
  sync: (pickups: EntityStore<Carrot>) => void;
}

/**
 * Placeholder shapes for dropped Carrots (design spec §8); a texture swaps
 * in later with no change to the simulation (ADR 0001 / 0002).
 */
export function createPickupLayer(): PickupLayer {
  const container = new Container();
  const views = new Map<Carrot, Graphics>();

  return {
    container,
    sync(pickups: EntityStore<Carrot>): void {
      const active = new Set<Carrot>();

      pickups.forEachActive((carrot) => {
        active.add(carrot);
        let view = views.get(carrot);
        if (!view) {
          view = new Graphics().circle(0, 0, CARROT_RADIUS).fill(0xe8952c);
          views.set(carrot, view);
          container.addChild(view);
        }
        view.position.set(carrot.x, carrot.y);
      });

      for (const [carrot, view] of views) {
        if (active.has(carrot)) continue;
        container.removeChild(view);
        view.destroy();
        views.delete(carrot);
      }
    },
  };
}

export interface BossView {
  view: Graphics;
  /** Repositions the view from `boss`, or hides it when `boss` is undefined. */
  sync: (boss: Boss | undefined) => void;
}

/**
 * Placeholder shape for the Bloatlord (design spec §6, Wave 5); a texture
 * swaps in later with no change to the simulation (ADR 0001 / 0002).
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

export interface SporeCloudLayer {
  container: Container;
  /** Syncs child Graphics 1:1 with the store's active clouds, same
   * identity-keyed reuse as `EnemyLayer.sync`. */
  sync: (clouds: EntityStore<SporeCloud>) => void;
}

/**
 * Placeholder shapes for Spore Burst's lingering hazard clouds (design spec
 * §6, Boss Phase 2); a texture swaps in later with no change to the
 * simulation (ADR 0001 / 0002).
 */
export function createSporeCloudLayer(): SporeCloudLayer {
  const container = new Container();
  const views = new Map<SporeCloud, Graphics>();

  return {
    container,
    sync(clouds: EntityStore<SporeCloud>): void {
      const active = new Set<SporeCloud>();

      clouds.forEachActive((cloud) => {
        active.add(cloud);
        let view = views.get(cloud);
        if (!view) {
          view = new Graphics().circle(0, 0, cloud.radius).fill({ color: 0x5fbf6f, alpha: 0.35 });
          views.set(cloud, view);
          container.addChild(view);
        }
        view.position.set(cloud.x, cloud.y);
      });

      for (const [cloud, view] of views) {
        if (active.has(cloud)) continue;
        container.removeChild(view);
        view.destroy();
        views.delete(cloud);
      }
    },
  };
}
