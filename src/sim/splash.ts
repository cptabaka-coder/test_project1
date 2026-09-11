/**
 * Splash damage falls off linearly from full strength at the epicenter to 0
 * at the radius edge (Plasma Cannon — design spec §5: "direct + splash AoE").
 */
export function splashFalloff(distance: number, radius: number): number {
  return Math.max(0, 1 - distance / radius);
}
