import type { FrameInputs, GameState } from "../sim/types";
import { drainAccumulator } from "./accumulator";

/** Hard ceiling on simulation steps per rendered frame — the spiral-of-death guard. */
const MAX_STEPS_PER_FRAME = 5;

export interface LoopOptions {
  state: GameState;
  /** Advance the simulation one fixed step. */
  step: (state: GameState, inputs: FrameInputs, dtMs: number) => void;
  /** Sample player intent once per rendered frame. */
  sampleInputs: () => FrameInputs;
  /** Draw the world; `alpha` is the interpolation fraction into the next step. */
  render: (state: GameState, alpha: number) => void;
  fixedDtMs: number;
}

export interface Loop {
  start: () => void;
  stop: () => void;
}

/**
 * The fixed-timestep loop (ADR 0002). This is the composition layer: it owns
 * `requestAnimationFrame` and the clock, and drives the pure `drainAccumulator`
 * and `step`. It holds no game logic of its own, which is why it is verified by
 * running the game rather than by unit tests.
 */
export function createLoop(opts: LoopOptions): Loop {
  const { state, step, sampleInputs, render, fixedDtMs } = opts;

  let running = false;
  let rafId = 0;
  let lastMs = 0;
  let accumMs = 0;

  const frame = (nowMs: number): void => {
    if (!running) return;

    const { steps, accumMs: rest, alpha } = drainAccumulator(
      accumMs,
      nowMs - lastMs,
      fixedDtMs,
      MAX_STEPS_PER_FRAME,
    );
    lastMs = nowMs;
    accumMs = rest;

    const inputs = sampleInputs();
    for (let i = 0; i < steps; i++) {
      step(state, inputs, fixedDtMs);
    }

    render(state, alpha);
    rafId = requestAnimationFrame(frame);
  };

  return {
    start(): void {
      if (running) return;
      running = true;
      lastMs = performance.now();
      accumMs = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop(): void {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
}
