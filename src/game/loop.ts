/**
 * The fixed-timestep loop belongs here (ADR 0002): a 60 Hz accumulator that
 * calls `step()` a whole number of times per rendered frame, with the renderer
 * interpolating between the last two simulation states.
 *
 * NOT IMPLEMENTED — this is issue #2. For issue #1, `main.ts` relies on PixiJS's
 * built-in render ticker to draw the static empty Arena.
 */
export {};
