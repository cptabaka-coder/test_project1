import type { FrameInputs } from "../sim/types";

/** WASD + arrow keys, each pressed key contributing ±1 on one axis. */
const KEY_TO_AXIS: Record<string, readonly [dx: number, dy: number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

/** Below this stick magnitude, treat the gamepad as centered (controller drift). */
const GAMEPAD_DEADZONE = 0.15;

/**
 * Samples WASD/arrow keys and the first connected gamepad's left stick into
 * `FrameInputs`. DOM/Gamepad-API glue for the loop (issue #4) — not part of
 * `src/sim`, so it is verified by running the game rather than unit-tested.
 */
export function createInputSampler(): () => FrameInputs {
  const pressed = new Set<string>();

  window.addEventListener("keydown", (e) => {
    if (e.code in KEY_TO_AXIS) pressed.add(e.code);
  });
  window.addEventListener("keyup", (e) => {
    pressed.delete(e.code);
  });

  return (): FrameInputs => {
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      const gx = pad.axes[0] ?? 0;
      const gy = pad.axes[1] ?? 0;
      if (Math.hypot(gx, gy) > GAMEPAD_DEADZONE) return { moveX: gx, moveY: gy };
    }

    let moveX = 0;
    let moveY = 0;
    for (const code of pressed) {
      const [dx, dy] = KEY_TO_AXIS[code]!;
      moveX += dx;
      moveY += dy;
    }
    return { moveX, moveY };
  };
}
