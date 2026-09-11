/**
 * HP bar + GameOver overlay (design spec §2: "HUD / Shop / Level-Up: DOM
 * overlays, not Pixi"). Plain DOM/CSS, verified by running the game.
 */
export interface Hud {
  /** Reflects the bunny's current HP and the GameOver state each frame. */
  update: (hp: number, maxHp: number, isGameOver: boolean) => void;
}

export function createHud(host: HTMLElement): Hud {
  const hpBar = document.createElement("div");
  hpBar.style.cssText =
    "position:fixed;left:8px;top:28px;width:160px;height:14px;" +
    "background:#2a2d3d;border:1px solid #3a3f5c;";
  const hpFill = document.createElement("div");
  hpFill.style.cssText = "height:100%;background:#d9534f;";
  hpBar.appendChild(hpFill);
  host.appendChild(hpBar);

  const gameOverOverlay = document.createElement("div");
  gameOverOverlay.textContent = "GAME OVER";
  gameOverOverlay.style.cssText =
    "position:fixed;inset:0;align-items:center;justify-content:center;" +
    "font:bold 48px ui-monospace,monospace;color:#e6e6f0;letter-spacing:0.1em;" +
    "background:rgba(11,11,15,0.6);pointer-events:none;display:none;";
  host.appendChild(gameOverOverlay);

  return {
    update(hp: number, maxHp: number, isGameOver: boolean): void {
      const pct = Math.max(0, Math.min(1, hp / maxHp)) * 100;
      hpFill.style.width = `${pct}%`;
      gameOverOverlay.style.display = isGameOver ? "flex" : "none";
    },
  };
}
