import { Application, Container } from "pixi.js";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "./data/constants";
import { createArenaView } from "./systems/render";

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

// One fixed logical stage (1280x720). The whole stage is scaled to fit the
// window — integer scale when it fits, fractional below 1x — and the CSS grid
// in index.html letterboxes it. Gameplay code always works in logical space.
const stage = new Container();
stage.addChild(createArenaView());
app.stage.addChild(stage);

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

// Issue #1 is render-only: PixiJS's built-in ticker redraws the static Arena.
// The fixed-timestep simulation loop is issue #2 — see src/game/loop.ts.
