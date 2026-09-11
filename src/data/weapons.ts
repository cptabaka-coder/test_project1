/**
 * Weapon data (design spec §5). Weapon Levels are data-driven: `levels[0]` is
 * Level I, `levels[1]` Level II, etc. Only Level I is populated for now
 * (issues #6, #8) — the Shop wires up buying further Levels later.
 */
export type WeaponFamily = "Melee" | "Laser" | "Plasma";

/** How a Weapon resolves its hits each time it fires — dispatches step()'s firing logic. */
export type DeliveryMode =
  | "melee-arc" // sweeps a cone of enemies (Knife)
  | "melee-single" // a single stab at the nearest enemy only (Wooden Stake)
  | "hitscan" // an instant line, piercing up to pierceCount enemies (Laser Pistol)
  | "lobbed-aoe"; // travels to the target point, then direct + falloff splash (Plasma Cannon)

export interface WeaponLevelStats {
  damage: number;
  attacksPerSecond: number;
  /** Reach in px. For Melee/hitscan, the strike distance; for lobbed, the max lob distance. */
  range: number;
  /** melee-arc only: the hit-detection cone width, in degrees. */
  arcDegrees?: number;
  /** hitscan only: the max number of enemies one shot can hit. */
  pierceCount?: number;
  /** lobbed-aoe only: travel speed to the target point. */
  projectileSpeed?: number;
  /** lobbed-aoe only: the splash's radius and its (falloff-scaled) damage. */
  splashRadius?: number;
  splashDamage?: number;
}

export interface WeaponDef {
  id: string;
  family: WeaponFamily;
  deliveryMode: DeliveryMode;
  levels: WeaponLevelStats[];
  /** Level I Shop price in Carrots. Not given in the design doc (only Item
   * prices are, §10) — a reasonable placeholder pending real balance. */
  basePrice: number;
}

export const KNIFE: WeaponDef = {
  id: "knife",
  family: "Melee",
  deliveryMode: "melee-arc",
  levels: [{ damage: 6, attacksPerSecond: 2.0, range: 60, arcDegrees: 60 }],
  basePrice: 10,
};

export const WOODEN_STAKE: WeaponDef = {
  id: "stake",
  family: "Melee",
  deliveryMode: "melee-single",
  levels: [{ damage: 14, attacksPerSecond: 0.9, range: 45 }],
  basePrice: 14,
};

export const LASER_PISTOL: WeaponDef = {
  id: "laser_pistol",
  family: "Laser",
  deliveryMode: "hitscan",
  levels: [{ damage: 3, attacksPerSecond: 4.0, range: 2000, pierceCount: 2 }],
  basePrice: 16,
};

export const PLASMA_CANNON: WeaponDef = {
  id: "plasma_cannon",
  family: "Plasma",
  deliveryMode: "lobbed-aoe",
  levels: [
    {
      damage: 22,
      attacksPerSecond: 0.6,
      range: 2000,
      projectileSpeed: 260,
      splashRadius: 70,
      splashDamage: 12,
    },
  ],
  basePrice: 20,
};

/** Every Weapon the Shop can offer (design spec §9). */
export const ALL_WEAPONS: WeaponDef[] = [KNIFE, WOODEN_STAKE, LASER_PISTOL, PLASMA_CANNON];
