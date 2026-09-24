import { STAT_KEYS, type StatBlock, type StatKey, type YokaiSpecies } from "./types";

const INV_98_F32 = 0.0102040814235806465;
const RANK_SCALE_F32 = 0.009999999776482582;
const f32 = Math.fround;

export function isValidRankUpCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 5;
}

export function rankedBase(value: number, rankUps: number): number {
  if (!isValidRankUpCount(rankUps)) {
    throw new RangeError("Rank-up treasure count must be an integer from 0 through 5.");
  }

  const percent = 100 + 6 * rankUps;
  const scaledPercent = f32(percent * value);
  const scaledBase = f32(scaledPercent * RANK_SCALE_F32);
  return Math.floor(f32(scaledBase + 0.5));
}

export function calculateStat(input: {
  species: YokaiSpecies;
  stat: StatKey;
  level: number;
  rankUps: number;
  iv: number;
  fitness: number;
  equipment: number;
}): number {
  const { species, stat, level, rankUps, iv, fitness, equipment } = input;
  const adjustedA = rankedBase(species.baseA[stat], rankUps);
  const adjustedB = rankedBase(species.baseB[stat], rankUps);

  const progress = f32(f32(level - 1) * INV_98_F32);
  const delta = f32(iv + adjustedB - adjustedA);
  const product = f32(delta * progress);
  const growth = f32(f32(adjustedA) + product);
  const withSportsClub = f32(growth + f32(fitness));
  const withEquipment = f32(withSportsClub + f32(equipment));

  return Math.max(1, Math.min(999, Math.trunc(withEquipment)));
}

export function calculateStats(
  species: YokaiSpecies,
  level: number,
  rankUps: number,
  iv: StatBlock,
  fitness: StatBlock,
  equipment: StatBlock,
): StatBlock {
  return Object.fromEntries(
    STAT_KEYS.map((stat) => [
      stat,
      calculateStat({
        species,
        stat,
        level,
        rankUps,
        iv: iv[stat],
        fitness: fitness[stat],
        equipment: equipment[stat],
      }),
    ]),
  ) as StatBlock;
}

export function ivWeightedTotal(iv: StatBlock): number {
  return iv.hp / 2 + iv.strength + iv.spirit + iv.defense + iv.speed;
}

export function isValidIvValue(stat: StatKey, value: number): boolean {
  if (!Number.isInteger(value) || value < 0) return false;
  if (stat === "hp") return value <= 80 && value % 2 === 0;
  return value <= 40;
}

export function isValidIvSpread(iv: StatBlock): boolean {
  return STAT_KEYS.every((stat) => isValidIvValue(stat, iv[stat])) && ivWeightedTotal(iv) === 40;
}
