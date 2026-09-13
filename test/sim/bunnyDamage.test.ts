import { describe, expect, it } from "vitest";
import { BUNNY_IFRAME_SECONDS } from "../../src/data/constants";
import { resolveBunnyDamage } from "../../src/sim/bunnyDamage";

describe("resolveBunnyDamage", () => {
  it("reduces bunny HP by the damage amount and starts the iframe window", () => {
    const bunny = { hp: 100, iframeSeconds: 0 };

    resolveBunnyDamage(bunny, 15);

    expect(bunny.hp).toBe(85);
    expect(bunny.iframeSeconds).toBe(BUNNY_IFRAME_SECONDS);
  });

  it("credits a lifesteal source with a percentage of the damage dealt", () => {
    const bunny = { hp: 100, iframeSeconds: 0 };
    const healer = { hp: 50, maxHp: 100 };

    resolveBunnyDamage(bunny, 20, { entity: healer, percent: 50 });

    expect(healer.hp).toBe(60); // 50 + (20 * 0.5)
  });

  it("caps lifesteal healing at the source's max HP", () => {
    const bunny = { hp: 100, iframeSeconds: 0 };
    const healer = { hp: 95, maxHp: 100 };

    resolveBunnyDamage(bunny, 20, { entity: healer, percent: 50 }); // would heal to 105

    expect(healer.hp).toBe(100);
  });
});
