# Deterministic fixed-timestep simulation, isolated from rendering

The game logic runs on a fixed 60 Hz timestep driven by an accumulator, with the
renderer interpolating between the last two simulation states. All randomness goes
through a single seeded RNG. The simulation imports no PixiJS types and reads no
wall-clock time.

## Why

Hundreds of entities on weak hardware means frame times will vary; a fixed step keeps
physics and spawn pacing stable regardless of frame rate. Determinism from a seed makes
bugs reproducible, enables seed-sharing and replays later, and lets the pure simulation
be unit-tested with no canvas.

## Consequences

Requires a strict sim/render boundary and render-side interpolation bookkeeping —
accepted deliberately. This boundary is also what keeps the PixiJS choice in
[ADR 0001](./0001-web-typescript-pixijs.md) reversible.
