# src/ui

Hand-written DOM overlays — HUD, Shop, Level-Up screens (design spec §2). These
sit on top of the PixiJS canvas rather than being drawn inside it, so they are
plain DOM/CSS and are verified by running the game, not by unit tests.

`hud.ts` (HP bar + GameOver overlay) landed with issue #5. `levelUp.ts`
(1-of-3 Stat-gain overlay) landed with issue #9. Shop lands with issue #10.
