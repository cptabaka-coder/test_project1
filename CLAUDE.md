# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Bunny Survivor** — a top-down arena horde-survivor for the browser, inspired by *Brotato*.
A cybernetic bunny holds a fixed arena against waves of zombie- and vampire-bunnies and
builds a stronger loadout in a shop between waves.

- Design spec (vertical slice): `docs/design/vertical-slice.md`
- Domain glossary / ubiquitous language: `CONTEXT.md` — use these terms in code and issues
- Architecture decisions: `docs/adr/`

## Status

Early build. Scaffold (#1) and the fixed-timestep loop (#2) are done. Next: object
pools / spatial hash / entity model (#3), then the bunny (#4). Roadmap is issues #1–#14.

## Commands

- `npm run dev` — Vite dev server
- `npm test` / `npm run test:watch` — Vitest against `test/**`
- `npm run build` — type-check then static build to `dist/`
- `npm run lint` — ESLint (also enforces the `src/sim/**` no-renderer-imports rule)

## Architecture (intended)

- **Stack:** TypeScript · PixiJS v8 · Vite · Vitest. Static build, no backend. Targets
  60 fps on integrated graphics (ThinkPad T490 reference).
- **Sim/render split is load-bearing** (ADR 0002): game logic runs on a fixed 60 Hz
  timestep with a seeded RNG and imports no PixiJS types; the renderer interpolates
  between sim states. Keep all randomness behind the seeded RNG and keep `src/sim/` and
  `src/data/` free of rendering and wall-clock time — that boundary is what keeps the
  simulation unit-testable and the renderer replaceable.
- **Difficulty scales with wave number only** (ADR 0003) — never with player power. Do
  not add rubber-banding.
- Pure logic (`src/sim/`, `src/data/`, `src/game/accumulator.ts`: damage/armor/dodge math,
  RNG determinism, the fixed-timestep accumulator, wave-budget generation, targeting) is
  the unit-test surface. The rAF driver (`src/game/loop.ts`), renderer and DOM UI are
  verified by running the game, not unit-tested. No E2E for the slice.
- All game logic is reachable through one seam: `step(state, inputs, dt)` in `src/sim/`.

## Conventions

- Environment configuration goes in `.env` / `.env.*` files, which are gitignored. Commit a `.env.example` documenting required variables (this pattern is already whitelisted in `.gitignore`).

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `cptabaka-coder/test_project1`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` plus `docs/adr/` at the repo root, both created lazily by `/domain-modeling`. See `docs/agents/domain.md`.
