import { Application, Container } from "pixi.js";
import { createLoop } from "./game/loop";
import { createInputSampler } from "./game/input";
import { FIXED_DT, LOGICAL_HEIGHT, LOGICAL_WIDTH } from "./data/constants";
import { createInitialState } from "./sim/types";
import { step } from "./sim/step";
import { createArenaView, createBunnyView, createEnemyLayer } from "./systems/render";
import { createHud } from "./ui/hud";

const host = document.getElementById("app");
if (!host) throw new Error("#app host element is missing");

// Seed the Run from ?seed=… when given (reproducible), otherwise pick one and
// show it so a run can be reported and replayed.
const url = new URL(window.location.href);
const seedParam = url.searchParams.get("seed");
const seed = seedParam !== null ? Number(seedParam) | 0 : (Math.random() * 2 ** 32) | 0;

const state = createInitialState(seed);

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
const enemyLayer = createEnemyLayer();
stage.addChild(enemyLayer.container);
const bunnyView = createBunnyView();
stage.addChild(bunnyView);
app.stage.addChild(stage);

const hud = createHud(document.body);

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

// PixiJS renders the stage on its own ticker; this loop owns the simulation.
const loop = createLoop({
  state,
  step,
  sampleInputs: createInputSampler(),
  render: (s) => {
    bunnyView.position.set(s.bunny.x, s.bunny.y);
    enemyLayer.sync(s.enemies);
    hud.update(s.bunny.hp, s.bunny.maxHp, s.phase === "GameOver");
    readout.textContent = `seed 0x${(seed >>> 0).toString(16)} · tick ${s.tick}`;
  },
  fixedDtMs: FIXED_DT * 1000,
});
loop.start();
