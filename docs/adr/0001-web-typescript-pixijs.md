# Web + TypeScript + PixiJS for the client

The game targets low-end hardware (a ThinkPad T490 with Intel UHD 620 is the
reference) and must be trivial to share and playtest. We build it as a static web
app in TypeScript, rendering with PixiJS v8 (WebGL2 with a Canvas fallback),
bundled by Vite, and deployed as static files to itch.io / GitHub Pages. No backend.

## Considered options

- **Native engine (Godot, or Rust + macroquad/bevy).** Rejected: raises the install
  and distribution cost for playtesters, and adds friction on this immutable-filesystem
  workstation. A fixed-camera 2D horde survivor sits well within a browser's budget.
- **Plain Canvas2D, no render library.** Rejected: struggles past a few hundred moving
  sprites on integrated graphics, and we would face a renderer swap once art lands.

## Consequences

The lock-in is real — moving off PixiJS later means rewriting the render layer — so the
simulation is kept fully independent of it (see [ADR 0002](./0002-deterministic-fixed-timestep-sim.md)).
