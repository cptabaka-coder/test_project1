/**
 * Weapon data (design spec §5). Weapon Levels are data-driven: `levels[0]` is
 * Level I, `levels[1]` Level II, etc. Only Knife Level I is populated for now
 * (issue #6) — the Shop wires up buying further Levels later.
 */
export type WeaponFamily = "Melee" | "Laser" | "Plasma";

export interface WeaponLevelStats {
  damage: number;
  attacksPerSecond: number;
  /** Reach in px. For Melee, the swing radius; for ranged, shot range. */
  range: number;
  /** Melee only: the hit-detection cone width, in degrees. */
  arcDegrees?: number;
}

export interface WeaponDef {
  id: string;
  family: WeaponFamily;
  levels: WeaponLevelStats[];
}

export const KNIFE: WeaponDef = {
  id: "knife",
  family: "Melee",
  levels: [{ damage: 6, attacksPerSecond: 2.0, range: 60, arcDegrees: 60 }],
};
