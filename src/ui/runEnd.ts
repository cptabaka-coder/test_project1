/**
 * GameOver and Victory screens: a Run summary (wave reached, kills, level)
 * and Restart (design spec §2, issue #13). Plain DOM/CSS, verified by
 * running the game.
 */
export interface RunSummary {
  wave: number;
  kills: number;
  level: number;
}

export interface RunEndOverlay {
  /** `kind` is `undefined` while neither GameOver nor Victory. `onRestart`
   * fires once per Restart click. */
  update: (kind: "GameOver" | "Victory" | undefined, summary: RunSummary, onRestart: () => void) => void;
}

export function createRunEndOverlay(host: HTMLElement): RunEndOverlay {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;flex-direction:column;align-items:center;justify-content:center;gap:12px;" +
    "background:rgba(11,11,15,0.85);display:none;";
  host.appendChild(overlay);

  const title = document.createElement("div");
  title.style.cssText =
    "font:bold 44px ui-monospace,monospace;color:#e6e6f0;letter-spacing:0.1em;";
  overlay.appendChild(title);

  const summaryLine = document.createElement("div");
  summaryLine.style.cssText = "font:16px ui-monospace,monospace;color:#8b8fa8;";
  overlay.appendChild(summaryLine);

  const restartButton = document.createElement("button");
  restartButton.textContent = "Restart";
  restartButton.style.cssText =
    "font:18px ui-monospace,monospace;padding:10px 24px;margin-top:8px;" +
    "background:#1b1d2b;color:#e6e6f0;border:1px solid #3a3f5c;cursor:pointer;";
  overlay.appendChild(restartButton);

  let onRestartRef: (() => void) | undefined;
  restartButton.addEventListener("click", () => onRestartRef?.());

  return {
    update(kind, summary, onRestart): void {
      onRestartRef = onRestart;
      if (!kind) {
        overlay.style.display = "none";
        return;
      }

      title.textContent = kind === "Victory" ? "VICTORY" : "GAME OVER";
      summaryLine.textContent =
        `Wave ${summary.wave} · ${summary.kills} kills · Level ${summary.level}`;
      overlay.style.display = "flex";
    },
  };
}
