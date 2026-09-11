import type { Stats } from "../sim/types";

/**
 * The Level-Up Stat pool (design spec §8). Each option's `id` names the
 * `Stats` field it adds `amount` to — except `maxHp`, which also heals the
 * bunny by the same amount (see `src/sim/levelUp.ts`).
 */
export interface StatGainOption {
  id: keyof Stats;
  label: string;
  amount: number;
}

export const STAT_GAIN_POOL: StatGainOption[] = [
  { id: "maxHp", label: "+1 Max HP", amount: 1 },
  { id: "damagePercent", label: "+5% Damage", amount: 5 },
  { id: "attackSpeedPercent", label: "+8% Attack Speed", amount: 8 },
  { id: "critChancePercent", label: "+3% Crit", amount: 3 },
  { id: "armor", label: "+5 Armor", amount: 5 },
  { id: "dodgePercent", label: "+5% Dodge", amount: 5 },
  { id: "moveSpeedPercent", label: "+6% Move Speed", amount: 6 },
  { id: "pickupRange", label: "+10 Pickup Range", amount: 10 },
  { id: "hpRegen", label: "+1 HP Regen", amount: 1 },
];
