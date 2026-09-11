/**
 * The bunny's HP bar (design spec §2: "HUD / Shop / Level-Up: DOM overlays,
 * not Pixi"). Plain DOM/CSS, verified by running the game.
 */
export interface Hud {
  update: (hp: number, maxHp: number) => void;
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

  return {
    update(hp: number, maxHp: number): void {
      const pct = Math.max(0, Math.min(1, hp / maxHp)) * 100;
      hpFill.style.width = `${pct}%`;
    },
  };
}
