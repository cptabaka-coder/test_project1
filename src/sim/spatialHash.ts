/**
 * Uniform grid broad-phase for circle-vs-circle collision (design spec §2).
 *
 * Rebuilt every fixed step from scratch: `clear()` then `insert()` every live
 * entity, then `queryCircle()` per entity to gather nearby candidates. Returned
 * candidates are cell-granularity, not exact-filtered — callers still do the
 * precise circle-vs-circle distance check.
 */
export interface SpatialHash {
  insert(id: number, x: number, y: number, radius: number): void;
  queryCircle(x: number, y: number, radius: number): number[];
  clear(): void;
}

export function createSpatialHash(cellSize: number): SpatialHash {
  const cells = new Map<string, number[]>();

  function cellKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  function forEachCellInBounds(
    x: number,
    y: number,
    radius: number,
    fn: (key: string) => void,
  ): void {
    const minCx = Math.floor((x - radius) / cellSize);
    const maxCx = Math.floor((x + radius) / cellSize);
    const minCy = Math.floor((y - radius) / cellSize);
    const maxCy = Math.floor((y + radius) / cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        fn(cellKey(cx, cy));
      }
    }
  }

  return {
    insert(id: number, x: number, y: number, radius: number): void {
      forEachCellInBounds(x, y, radius, (key) => {
        const bucket = cells.get(key);
        if (bucket) {
          bucket.push(id);
        } else {
          cells.set(key, [id]);
        }
      });
    },

    queryCircle(x: number, y: number, radius: number): number[] {
      const found = new Set<number>();
      forEachCellInBounds(x, y, radius, (key) => {
        const bucket = cells.get(key);
        if (bucket) {
          for (const id of bucket) found.add(id);
        }
      });
      return Array.from(found);
    },

    clear(): void {
      cells.clear();
    },
  };
}
