/**
 * Title/Menu screen (design spec §2's Run state machine starts in Menu;
 * issue #13). Plain DOM/CSS, verified by running the game.
 */
export interface MenuOverlay {
  /** Shows while `isMenu`; `onStart` fires once per Start click. */
  update: (isMenu: boolean, seed: number, onStart: () => void) => void;
}

export function createMenuOverlay(host: HTMLElement): MenuOverlay {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;flex-direction:column;align-items:center;justify-content:center;gap:16px;" +
    "background:#0b0b0f;display:none;";
  host.appendChild(overlay);

  const title = document.createElement("div");
  title.textContent = "BUNNY SURVIVOR";
  title.style.cssText =
    "font:bold 40px ui-monospace,monospace;color:#e6e6f0;letter-spacing:0.1em;";
  overlay.appendChild(title);

  const seedLabel = document.createElement("div");
  seedLabel.style.cssText = "font:14px ui-monospace,monospace;color:#8b8fa8;";
  overlay.appendChild(seedLabel);

  const startButton = document.createElement("button");
  startButton.textContent = "Start";
  startButton.style.cssText =
    "font:20px ui-monospace,monospace;padding:10px 28px;" +
    "background:#1b1d2b;color:#e6e6f0;border:1px solid #3a3f5c;cursor:pointer;";
  overlay.appendChild(startButton);

  let onStartRef: (() => void) | undefined;
  startButton.addEventListener("click", () => onStartRef?.());

  return {
    update(isMenu: boolean, seed: number, onStart: () => void): void {
      overlay.style.display = isMenu ? "flex" : "none";
      onStartRef = onStart;
      if (isMenu) seedLabel.textContent = `seed 0x${(seed >>> 0).toString(16)}`;
    },
  };
}
