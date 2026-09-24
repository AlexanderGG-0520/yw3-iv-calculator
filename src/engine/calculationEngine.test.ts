import { describe, expect, it } from "vitest";
import { calculateStats, isValidIvSpread, ivWeightedTotal, rankedBase } from "./calculationEngine";
import { fitnessFromSessions } from "./fitness";
import { getYokaiSpecies } from "./yokaiData";

const zero = { hp: 0, strength: 0, spirit: 0, defense: 0, speed: 0 };
const balancedIv = { hp: 16, strength: 8, spirit: 8, defense: 8, speed: 8 };

describe("YW3 calculation engine", () => {
  it("reproduces the published level-50 Jibanyan example at original rank", () => {
    const jibanyan = getYokaiSpecies("yw3-243");
    expect(calculateStats(jibanyan, 50, 0, balancedIv, zero, zero)).toEqual({
      hp: 206,
      strength: 97,
      spirit: 28,
      defense: 60,
      speed: 126,
    });
  });

  it("reproduces four rank-ups and five Strength Sports Club sessions", () => {
    const jibanyan = getYokaiSpecies("yw3-243");
    expect(calculateStats(jibanyan, 50, 4, balancedIv, zero, zero)).toEqual({
      hp: 254,
      strength: 120,
      spirit: 33,
      defense: 74,
      speed: 156,
    });

    const fitness = fitnessFromSessions({ strength: 5, spirit: 0, defense: 0, speed: 0 });
    expect(calculateStats(jibanyan, 50, 4, balancedIv, fitness, zero)).toEqual({
      hp: 254,
      strength: 145,
      spirit: 33,
      defense: 64,
      speed: 156,
    });
  });

  it("applies rank-up percentage to the original endpoint rather than compounding", () => {
    expect(rankedBase(100, 2)).toBe(112);
    expect(rankedBase(100, 5)).toBe(130);
  });

  it("uses the weighted 40-point IV pool", () => {
    expect(ivWeightedTotal(balancedIv)).toBe(40);
    expect(isValidIvSpread(balancedIv)).toBe(true);
    expect(isValidIvSpread({ ...balancedIv, hp: 15 })).toBe(false);
  });
});
