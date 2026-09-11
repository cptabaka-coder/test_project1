import { describe, expect, it } from "vitest";
import { createPool } from "../../src/sim/pool";

describe("createPool", () => {
  it("creates a new item via the factory when nothing is free to reuse", () => {
    let created = 0;
    const pool = createPool(
      () => {
        created += 1;
        return { hp: 10 };
      },
      (item) => {
        item.hp = 10;
      },
    );

    const item = pool.acquire();

    expect(item).toEqual({ hp: 10 });
    expect(created).toBe(1);
  });

  it("reuses a released item instead of allocating a new one", () => {
    let created = 0;
    const pool = createPool(
      () => {
        created += 1;
        return { hp: 10 };
      },
      (item) => {
        item.hp = 10;
      },
    );

    const first = pool.acquire();
    pool.release(first);
    const second = pool.acquire();

    expect(second).toBe(first);
    expect(created).toBe(1);
  });

  it("resets a reused item so state from its previous use does not leak", () => {
    const pool = createPool(
      () => ({ hp: 10 }),
      (item) => {
        item.hp = 10;
      },
    );

    const first = pool.acquire();
    first.hp = 1; // simulate damage taken during the item's previous life
    pool.release(first);

    const second = pool.acquire();

    expect(second.hp).toBe(10);
  });
});
