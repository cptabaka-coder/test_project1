import { describe, expect, it } from "vitest";
import { createEntityStore } from "../../src/sim/entityStore";

interface Dummy {
  hp: number;
  tag: string;
}

function makeDummy(): Dummy {
  return { hp: 0, tag: "" };
}

function resetDummy(item: Dummy): void {
  item.hp = 0;
  item.tag = "";
}

describe("createEntityStore", () => {
  it("spawns an active entity, initialized by the caller, visible to forEachActive", () => {
    const store = createEntityStore(2, makeDummy, resetDummy);

    const entity = store.spawn((item) => {
      item.hp = 5;
    });

    const seen: Dummy[] = [];
    store.forEachActive((item) => seen.push(item));

    expect(entity?.hp).toBe(5);
    expect(seen).toEqual([{ hp: 5, tag: "" }]);
  });

  it("despawn removes the entity from forEachActive and its slot leaks no state into the next spawn", () => {
    const store = createEntityStore(2, makeDummy, resetDummy);

    const first = store.spawn((item) => {
      item.hp = 5;
      item.tag = "boss";
    });
    store.despawn(first!);

    const afterDespawn: Dummy[] = [];
    store.forEachActive((item) => afterDespawn.push(item));

    // Second spawn only sets hp — tag must come back reset, not leak "boss".
    const second = store.spawn((item) => {
      item.hp = 9;
    });

    expect(afterDespawn).toEqual([]);
    expect(second).toBe(first);
    expect(second).toEqual({ hp: 9, tag: "" });
  });

  it("refuses to spawn beyond its fixed capacity", () => {
    const store = createEntityStore(1, makeDummy, resetDummy);

    const first = store.spawn((item) => {
      item.hp = 1;
    });
    const second = store.spawn((item) => {
      item.hp = 2;
    });

    expect(first).toBeDefined();
    expect(second).toBeUndefined();

    const seen: Dummy[] = [];
    store.forEachActive((item) => seen.push(item));
    expect(seen).toEqual([{ hp: 1, tag: "" }]);
  });
});
