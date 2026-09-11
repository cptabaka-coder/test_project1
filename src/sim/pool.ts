/**
 * Generic object pool (design spec §2) shared by enemies, projectiles, pickups
 * and particles: `acquire` reuses a released item where possible instead of
 * allocating, so steady-state gameplay does not churn the GC.
 */
export interface Pool<T> {
  /** Returns a free item, resetting it first if it was previously used. */
  acquire(): T;
  /** Returns an item to the pool for future reuse. */
  release(item: T): void;
}

export function createPool<T>(factory: () => T, reset: (item: T) => void): Pool<T> {
  const free: T[] = [];

  return {
    acquire(): T {
      const reused = free.pop();
      if (reused !== undefined) {
        reset(reused);
        return reused;
      }
      return factory();
    },
    release(item: T): void {
      free.push(item);
    },
  };
}
