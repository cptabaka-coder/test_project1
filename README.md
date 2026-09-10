# Bunny Survivor

A top-down arena horde-survivor for the browser. Play a lone cybernetic bunny holding an
arena against escalating waves of zombie- and vampire-bunnies; spend what the horde drops
to build a stronger loadout between fights. Inspired by *Brotato*.

**Status:** design phase — the vertical slice (waves 1–5 + boss) is not yet implemented.

## Documentation

- [`docs/design/vertical-slice.md`](docs/design/vertical-slice.md) — full design spec for the first shippable cut
- [`CONTEXT.md`](CONTEXT.md) — domain glossary / ubiquitous language
- [`docs/adr/`](docs/adr/) — architecture decisions

## Tech

TypeScript · PixiJS v8 · Vite · Vitest. Static build, no backend. Targets 60 fps on
integrated graphics (ThinkPad T490 reference).
