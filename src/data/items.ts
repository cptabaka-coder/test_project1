import type { Stats } from "../sim/types";

/**
 * The 13 slice Items (design spec §10): passive, stackable Stat modifiers,
 * never occupying a Weapon Slot. `basePrice` isn't given exactly in the
 * design doc — only a "base 8-15 Carrots" range — these are reasonable
 * placeholders within it.
 */
export interface ItemDef {
  id: string;
  label: string;
  statId: keyof Stats;
  amount: number;
  basePrice: number;
}

export const ALL_ITEMS: ItemDef[] = [
  { id: "sharpening_stone", label: "Sharpening Stone", statId: "meleeDamage", amount: 3, basePrice: 10 },
  { id: "focusing_lens", label: "Focusing Lens", statId: "energyDamage", amount: 3, basePrice: 10 },
  { id: "blast_compound", label: "Blast Compound", statId: "explosiveDamage", amount: 3, basePrice: 10 },
  { id: "adrenal_chip", label: "Adrenal Chip", statId: "attackSpeedPercent", amount: 8, basePrice: 12 },
  { id: "targeting_vi", label: "Targeting VI", statId: "critChancePercent", amount: 4, basePrice: 11 },
  { id: "nano_plate", label: "Nano-Plate", statId: "armor", amount: 6, basePrice: 10 },
  { id: "reflex_booster", label: "Reflex Booster", statId: "dodgePercent", amount: 5, basePrice: 12 },
  { id: "hydraulic_legs", label: "Hydraulic Legs", statId: "moveSpeedPercent", amount: 6, basePrice: 9 },
  { id: "carrot_magnet", label: "Carrot Magnet", statId: "pickupRange", amount: 25, basePrice: 8 },
  { id: "regen_nodule", label: "Regen Nodule", statId: "hpRegen", amount: 1, basePrice: 13 },
  { id: "bloodfang_serum", label: "Bloodfang Serum", statId: "lifestealPercent", amount: 4, basePrice: 15 },
  { id: "lucky_foot", label: "Lucky Foot", statId: "luck", amount: 10, basePrice: 9 },
  { id: "compost_unit", label: "Compost Unit", statId: "harvesting", amount: 2, basePrice: 8 },
];
