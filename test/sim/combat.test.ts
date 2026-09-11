import { describe, expect, it } from "vitest";
import {
  BUNNY_IFRAME_SECONDS,
  BUNNY_MAX_HP,
  SHAMBLER_CONTACT_DAMAGE,
  SHAMBLER_HP,
  SHAMBLER_RADIUS,
  SHAMBLER_SPEED,
} from "../../src/data/constants";
import { createInitialState } from "../../src/sim/types";
import { step } from "../../src/sim/step";
import { NO_INPUT } from "../../src/sim/types";

describe("createInitialState", () => {
  it("gives the bunny full HP", () => {
    const state = createInitialState(1);

    expect(state.bunny.hp).toBe(BUNNY_MAX_HP);
    expect(state.bunny.maxHp).toBe(BUNNY_MAX_HP);
  });
});

function spawnShamblerOnBunny(state: ReturnType<typeof createInitialState>) {
  return state.enemies.spawn((e) => {
    e.x = state.bunny.x;
    e.y = state.bunny.y;
    e.radius = SHAMBLER_RADIUS;
    e.hp = SHAMBLER_HP;
    e.speed = SHAMBLER_SPEED;
    e.contactDamage = SHAMBLER_CONTACT_DAMAGE;
  });
}

describe("step", () => {
  it("deals an enemy's contact damage to the bunny when they overlap", () => {
    const state = createInitialState(1);
    spawnShamblerOnBunny(state);

    step(state, NO_INPUT, 0);

    expect(state.bunny.hp).toBe(BUNNY_MAX_HP - SHAMBLER_CONTACT_DAMAGE);
  });

  it("grants i-frames after a hit, so a still-overlapping enemy deals no further damage", () => {
    const state = createInitialState(1);
    spawnShamblerOnBunny(state);

    step(state, NO_INPUT, 0); // first hit
    step(state, NO_INPUT, BUNNY_IFRAME_SECONDS / 2); // still within the i-frame window

    expect(state.bunny.hp).toBe(BUNNY_MAX_HP - SHAMBLER_CONTACT_DAMAGE);
  });

  it("deals damage again once the i-frame window has elapsed", () => {
    const state = createInitialState(1);
    spawnShamblerOnBunny(state);

    step(state, NO_INPUT, 0); // first hit
    step(state, NO_INPUT, BUNNY_IFRAME_SECONDS + 0.01); // i-frames expire

    expect(state.bunny.hp).toBe(BUNNY_MAX_HP - SHAMBLER_CONTACT_DAMAGE * 2);
  });

  it("transitions to GameOver when the bunny's HP reaches 0", () => {
    const state = createInitialState(1);
    state.bunny.hp = SHAMBLER_CONTACT_DAMAGE; // exactly lethal from one more hit
    spawnShamblerOnBunny(state);

    step(state, NO_INPUT, 0);

    expect(state.bunny.hp).toBeLessThanOrEqual(0);
    expect(state.phase).toBe("GameOver");
  });

  it("freezes the simulation once GameOver — no further enemy spawns", () => {
    const state = createInitialState(1);
    state.phase = "GameOver";
    state.bunny.hp = 0;
    state.waveSpawnSchedule = [0]; // due immediately, if spawning still ran

    step(state, NO_INPUT, 1);

    let activeCount = 0;
    state.enemies.forEachActive(() => {
      activeCount += 1;
    });
    expect(activeCount).toBe(0);
  });
});
