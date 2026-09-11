/**
 * A small "PAUSED" indicator (design spec §2, issue #13). Pausing itself is
 * a loop-level concern (stop/start the rAF loop) — this overlay only shows
 * the state, since the render loop stops running while paused. Plain
 * DOM/CSS, verified by running the game.
 */
export interface PauseOverlay {
  update: (isPaused: boolean) => void;
}

export function createPauseOverlay(host: HTMLElement): PauseOverlay {
  const overlay = document.createElement("div");
  overlay.textContent = "PAUSED — Esc to resume";
  overlay.style.cssText =
    "position:fixed;top:8px;left:50%;transform:translateX(-50%);" +
    "font:14px ui-monospace,monospace;color:#e6e6f0;background:#1b1d2b;" +
    "border:1px solid #3a3f5c;padding:4px 12px;display:none;";
  host.appendChild(overlay);

  return {
    update(isPaused: boolean): void {
      overlay.style.display = isPaused ? "block" : "none";
    },
  };
}
