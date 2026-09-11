import { createPool } from "./pool";

/**
 * Fixed-capacity, pool-backed store for one entity kind (enemies, projectiles,
 * pickups, particles — design spec §2). Owns nothing about what `T` means;
 * concrete fields land on `T` as later issues introduce them.
 */
export interface EntityStore<T> {
  /** Allocates (or reuses) an entity and runs `init` on it, or returns
   * `undefined` if the store is at capacity. */
  spawn(init: (item: T) => void): T | undefined;
  /** Deactivates an entity and returns it to the pool for reuse. */
  despawn(item: T): void;
  forEachActive(fn: (item: T) => void): void;
}

export function createEntityStore<T>(
  capacity: number,
  factory: () => T,
  reset: (item: T) => void,
): EntityStore<T> {
  const pool = createPool(factory, reset);
  const active: T[] = [];

  return {
    spawn(init: (item: T) => void): T | undefined {
      if (active.length >= capacity) return undefined;
      const item = pool.acquire();
      init(item);
      active.push(item);
      return item;
    },

    despawn(item: T): void {
      const index = active.indexOf(item);
      if (index === -1) return;
      active.splice(index, 1);
      pool.release(item);
    },

    forEachActive(fn: (item: T) => void): void {
      for (const item of active) fn(item);
    },
  };
}
