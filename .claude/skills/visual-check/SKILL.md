---
description: Launch Bunny Survivor's Vite dev server and drive it in headless Chromium (via Playwright) to visually verify renderer/DOM changes — screenshot the canvas, simulate key presses, check for console errors. Use this whenever a change touches src/main.ts, src/systems/, src/game/loop.ts, src/game/input.ts, or anything else outside src/sim (which is unit-tested instead).
---

# Visual-check driver

Agent-only tooling for visually verifying this project's renderer/DOM/input
code, which is deliberately **not** unit-tested (see CLAUDE.md: "the rAF
driver, renderer and DOM UI are verified by running the game, not
unit-tested"). This is not a project test suite — nothing here runs in `npm
test` or CI, and it does not change that convention. It exists because no
`chromium-cli` (the harness's usual headless-browser tool) is available in
this environment; `playwright` is installed as a devDependency and its
Chromium is cached at `~/.cache/ms-playwright` instead.

## Dev server

```bash
npm run dev -- --port 5174 > /tmp/vite-dev.log 2>&1 &
disown
timeout 30 bash -c 'until curl -sf http://localhost:5174 >/dev/null; do sleep 1; done'
```

Use a port other than Vite's default (5173) if a manual `npm run dev` might
already be running for the user. Stop it by port, not by PID (npm doesn't
forward signals to the child it spawns):

```bash
lsof -ti:5174 -sTCP:LISTEN | xargs -r kill
```

No auth, no login — the game loads straight into `Menu` phase and starts
running immediately.

## Drive it

`driver.mjs` in this directory is a small headless-Chromium REPL, the same
shape as `chromium-cli`: pipe newline-delimited commands to stdin, run from
the repo root so Playwright resolves from `node_modules`.

```bash
node .claude/skills/visual-check/driver.mjs <<'EOF'
nav http://localhost:5174
wait-for selector=canvas
wait 500
screenshot 01-initial
hold KeyD 500
screenshot 02-after-move-right
console-errors
EOF
```

Commands:

- `nav <url>`
- `wait-for selector=<css>` / `wait-for text=<text>`
- `wait <ms>` — plain pause; use after `wait-for selector=canvas` to let
  PixiJS render a frame and the fixed-step loop tick a few times.
- `screenshot [name]` — saved to `.visual-check/<name>.png` (or
  `$VISUAL_CHECK_OUT_DIR` if set); read the file with the Read tool afterward
  to actually look at it — don't just check that the command succeeded.
- `press <KeyboardEvent.code>` — single tap, e.g. `press Space`.
- `hold <KeyboardEvent.code> <ms>` — keydown, wait, keyup. Use this to test
  movement, e.g. `hold KeyD 500` to push the bunny right for half a second.
  Use the `Key*`/`Arrow*` `code` values (`KeyW`, `ArrowUp`, …), matching
  `src/game/input.ts`'s `KEY_TO_AXIS` map — not `key` values like `"w"`.
- `console-errors` — prints everything captured from `console.error` and
  uncaught page errors so far. Check this before declaring success; a canvas
  can render fine while something else throws.

## Gotchas

- **WebGL in headless Chromium.** PixiJS needs a WebGL context; headless
  Chromium has no real GPU. `driver.mjs` already launches with
  `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist` — if you write
  a one-off script instead of using the driver, you need the same flags or
  the canvas stays blank.
- **First paint.** Vite's first `nav` after a cold dev-server start can take
  a couple seconds to compile. `wait-for selector=canvas` handles this; a
  fixed `sleep`/`wait` alone does not.
- **Gamepad input can't be simulated this way.** `src/game/input.ts` reads
  `navigator.getGamepads()`; Playwright has no gamepad emulation. Keyboard
  (WASD/arrows) is the only input path this driver can exercise — gamepad
  behavior still needs a human with a controller.
- **Screenshots are diagnostic, not committed.** `.visual-check/` is a
  scratch output directory — gitignore it if it isn't already, don't check
  screenshots into the repo.
