import { Application, Container } from "pixi.js";
import { createLoop, type Loop } from "./game/loop";
import { createInputSampler } from "./game/input";
import { FIXED_DT, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "./data/constants";
import { createInitialState, type GameState } from "./sim/types";
import { step } from "./sim/step";
import {
  createArenaView,
  createBossView,
  createBunnyView,
  createEnemyLayer,
  createPickupLayer,
  createSporeCloudLayer,
} from "./systems/render";
import { createHud } from "./ui/hud";
import { createLevelUpOverlay } from "./ui/levelUp";
import { createMenuOverlay } from "./ui/menu";
import { createPauseOverlay } from "./ui/pause";
import { createRunEndOverlay } from "./ui/runEnd";
import { createShopOverlay } from "./ui/shop";
import { resolveLevelUpChoice } from "./sim/levelUp";
import { continueToNextWave, startRun } from "./sim/runFlow";
import { buyItem } from "./sim/items";
import { buyWeapon } from "./sim/shop";

const host = document.getElementById("app");
if (!host) throw new Error("#app host element is missing");

const app = new Application();
await app.init({
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT,
  antialias: false,
  roundPixels: true,
  backgroundColor: 0x0b0b0f,
  autoDensity: false,
});
host.appendChild(app.canvas);

// One fixed logical stage (1280x720), scaled to fit the window — integer scale
// when it fits, fractional below 1x — and letterboxed by the CSS grid.
const stage = new Container();
stage.addChild(createArenaView());
const pickupLayer = createPickupLayer();
stage.addChild(pickupLayer.container);
const sporeCloudLayer = createSporeCloudLayer();
stage.addChild(sporeCloudLayer.container);
const enemyLayer = createEnemyLayer();
stage.addChild(enemyLayer.container);
const bossView = createBossView();
stage.addChild(bossView.view);
const bunnyView = createBunnyView();
stage.addChild(bunnyView);
app.stage.addChild(stage);

const hud = createHud(document.body);
const levelUpOverlay = createLevelUpOverlay(document.body);
const menuOverlay = createMenuOverlay(document.body);
const shopOverlay = createShopOverlay(document.body);
const runEndOverlay = createRunEndOverlay(document.body);
const pauseOverlay = createPauseOverlay(document.body);

function fit(): void {
  const raw = Math.min(
    window.innerWidth / LOGICAL_WIDTH,
    window.innerHeight / LOGICAL_HEIGHT,
  );
  const scale = raw >= 1 ? Math.floor(raw) : raw;
  app.renderer.resize(LOGICAL_WIDTH * scale, LOGICAL_HEIGHT * scale);
  stage.scale.set(scale);
}

fit();
window.addEventListener("resize", fit);

// Small readout: seed for repro, plus tick count so the fixed-timestep loop is
// visibly advancing (and visibly catching up after a stall).
const readout = document.createElement("div");
readout.style.cssText =
  "position:fixed;left:8px;top:8px;font:12px ui-monospace,monospace;color:#8b8fa8;pointer-events:none";
document.body.appendChild(readout);

// Seed the Run from ?seed=… when given (reproducible) for the *first* Run
// only; Restart always rolls a fresh seed (design spec §13: "a new seed").
function rollRandomSeed(): number {
  return (Math.random() * 2 ** 32) | 0;
}

function pickInitialSeed(): number {
  const url = new URL(window.location.href);
  const seedParam = url.searchParams.get("seed");
  return seedParam !== null ? Number(seedParam) | 0 : rollRandomSeed();
}

let state: GameState;
let seed: number;
let loop: Loop;
let paused = false;
let hasStarted = false;

function buildLoop(): Loop {
  return createLoop({
    state,
    step,
    sampleInputs: createInputSampler(),
    render: (s) => {
      bunnyView.position.set(s.bunny.x, s.bunny.y);
      enemyLayer.sync(s.enemies);
      pickupLayer.sync(s.pickups);
      sporeCloudLayer.sync(s.sporeClouds);
      bossView.sync(s.boss);
      hud.update(s.bunny.hp, s.bunny.maxHp);
      levelUpOverlay.update(s.pendingLevelUpOptions, (choice) => resolveLevelUpChoice(s, choice));
      menuOverlay.update(s.phase === "Menu", seed, () => startRun(s));
      shopOverlay.update(
        s.phase === "Shop",
        s.shopOffers,
        s.bunny.carrots,
        (offerIndex) => {
          const offer = s.shopOffers[offerIndex];
          if (offer?.kind === "weapon") buyWeapon(s, offerIndex);
          else if (offer?.kind === "item") buyItem(s, offerIndex);
        },
        () => continueToNextWave(s),
      );
      runEndOverlay.update(
        s.phase === "GameOver" || s.phase === "Victory" ? s.phase : undefined,
        { wave: s.wave, kills: s.totalKills, level: s.bunny.level },
        () => restart(),
      );
      readout.textContent = `seed 0x${(seed >>> 0).toString(16)} · tick ${s.tick}`;
    },
    fixedDtMs: FIXED_DT * 1000,
  });
}

function restart(): void {
  loop?.stop();
  paused = false;
  pauseOverlay.update(false);
  seed = hasStarted ? rollRandomSeed() : pickInitialSeed();
  hasStarted = true;
  state = createInitialState(seed);
  loop = buildLoop();
  loop.start();
}

restart();

window.addEventListener("keydown", (e) => {
  if (e.code !== "Escape") return;
  if (state.phase === "Menu" || state.phase === "GameOver" || state.phase === "Victory") return;

  paused = !paused;
  pauseOverlay.update(paused);
  if (paused) loop.stop();
  else loop.start();
});
