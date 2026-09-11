# src/ui

Hand-written DOM overlays — HUD, Shop, Level-Up screens (design spec §2). These
sit on top of the PixiJS canvas rather than being drawn inside it, so they are
plain DOM/CSS and are verified by running the game, not by unit tests.

`hud.ts` (HP bar) landed with issue #5. `levelUp.ts` (1-of-3 Stat-gain
overlay) landed with issue #9. `shop.ts`, `menu.ts`, `runEnd.ts` (GameOver/
Victory summary + Restart), and `pause.ts` landed with issue #13, which
wired the full Run flow — `hud.ts`'s old standalone GameOver text was
folded into `runEnd.ts`'s richer summary screen.
