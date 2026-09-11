import type { StatGainOption } from "../data/levelUpPool";

/**
 * Level-Up overlay (design spec §2: "HUD / Shop / Level-Up: DOM overlays,
 * not Pixi"; §8: "pick 1 of 3"). Plain DOM/CSS, verified by running the game.
 */
export interface LevelUpOverlay {
  /** Shows (and rebuilds) the overlay while `options` is non-empty, hides it
   * otherwise. `onChoose` fires once per click, with the picked option. */
  update: (options: StatGainOption[], onChoose: (option: StatGainOption) => void) => void;
}

export function createLevelUpOverlay(host: HTMLElement): LevelUpOverlay {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;align-items:center;justify-content:center;gap:12px;" +
    "background:rgba(11,11,15,0.75);display:none;";
  host.appendChild(overlay);

  const title = document.createElement("div");
  title.textContent = "LEVEL UP";
  title.style.cssText =
    "position:fixed;top:30%;left:50%;transform:translate(-50%,-100%);" +
    "font:bold 28px ui-monospace,monospace;color:#e6e6f0;letter-spacing:0.1em;";
  overlay.appendChild(title);

  let shownOptions: StatGainOption[] | undefined;

  return {
    update(options: StatGainOption[], onChoose: (option: StatGainOption) => void): void {
      if (options.length === 0) {
        overlay.style.display = "none";
        shownOptions = undefined;
        return;
      }

      if (shownOptions === options) return; // already showing this exact roll
      shownOptions = options;

      overlay.querySelectorAll("button").forEach((button) => button.remove());
      for (const option of options) {
        const button = document.createElement("button");
        button.textContent = option.label;
        button.style.cssText =
          "font:16px ui-monospace,monospace;padding:10px 16px;" +
          "background:#1b1d2b;color:#e6e6f0;border:1px solid #3a3f5c;cursor:pointer;";
        button.addEventListener("click", () => onChoose(option));
        overlay.appendChild(button);
      }

      overlay.style.display = "flex";
    },
  };
}
