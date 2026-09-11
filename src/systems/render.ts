import { Container, Graphics } from "pixi.js";
import {
  ARENA_MARGIN,
  BUNNY_RADIUS,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
} from "../data/constants";

/**
 * Builds the static scene for issue #1: the logical stage backdrop and the
 * walled Arena. Entities, the bunny and interpolation come with later issues.
 *
 * Uses `Graphics` shapes now; textured sprites swap in later with no change to
 * the simulation (ADR 0001 / 0002).
 */
export function createArenaView(): Container {
  const view = new Container();

  const backdrop = new Graphics()
    .rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
    .fill(0x11121a);

  const arena = new Graphics()
    .rect(
      ARENA_MARGIN,
      ARENA_MARGIN,
      LOGICAL_WIDTH - ARENA_MARGIN * 2,
      LOGICAL_HEIGHT - ARENA_MARGIN * 2,
    )
    .fill(0x1b1d2b)
    .stroke({ width: 2, color: 0x3a3f5c, alignment: 1 });

  view.addChild(backdrop, arena);
  return view;
}

/**
 * Placeholder shape for the bunny (issue #4); a texture swaps in later with no
 * change to the simulation (ADR 0001 / 0002). Callers reposition it each frame
 * from `state.bunny`.
 */
export function createBunnyView(): Graphics {
  return new Graphics().circle(0, 0, BUNNY_RADIUS).fill(0xe6e6f0);
}
