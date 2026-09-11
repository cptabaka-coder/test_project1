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
  /** True if `item` is currently active (not despawned, not stale pool churn). */
  isActive(item: T): boolean;
  /** Like `spawn`, but at capacity evicts the oldest active entity first
   * instead of refusing — so it always succeeds (design spec §2: some
   * entity kinds, e.g. Pickups, "vacuum oldest" rather than queue/drop). */
  spawnVacuumingOldest(init: (item: T) => void): T;
  /** Raises or lowers the cap `spawn` enforces — the perf degrade path's
   * lever for shrinking the enemy cap under frame-time pressure (design
   * spec §2, issue #14). Never evicts already-active entities on its own. */
  setCapacity(capacity: number): void;
}

export function createEntityStore<T>(
  initialCapacity: number,
  factory: () => T,
  reset: (item: T) => void,
): EntityStore<T> {
  const pool = createPool(factory, reset);
  const active: T[] = [];
  let capacity = initialCapacity;

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

    isActive(item: T): boolean {
      return active.includes(item);
    },

    spawnVacuumingOldest(init: (item: T) => void): T {
      if (active.length >= capacity) {
        const oldest = active.shift()!;
        pool.release(oldest);
      }
      const item = pool.acquire();
      init(item);
      active.push(item);
      return item;
    },

    setCapacity(newCapacity: number): void {
      capacity = newCapacity;
    },
  };
}
