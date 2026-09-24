import type { ScoreProfileId, StatBlock } from "./types";

const PROFILES: Record<Exclude<ScoreProfileId, "balanced">, StatBlock> = {
  hp: { hp: 1, strength: 0, spirit: 0, defense: 0, speed: 0 },
  strength: { hp: 0, strength: 1, spirit: 0, defense: 0, speed: 0 },
  spirit: { hp: 0, strength: 0, spirit: 1, defense: 0, speed: 0 },
  defense: { hp: 0, strength: 0, spirit: 0, defense: 1, speed: 0 },
  speed: { hp: 0, strength: 0, spirit: 0, defense: 0, speed: 1 },

  physical: { hp: 0.25, strength: 2, spirit: 0, defense: 0.35, speed: 1.1 },
  magic: { hp: 0.25, strength: 0, spirit: 2, defense: 0.35, speed: 1.1 },

  "physical-speed": { hp: 0.1, strength: 2.2, spirit: 0, defense: 0.1, speed: 1.8 },
  "magic-speed": { hp: 0.1, strength: 0, spirit: 2.2, defense: 0.1, speed: 1.8 },

  "physical-bulk": { hp: 1, strength: 2, spirit: 0, defense: 1.2, speed: 0.3 },
  "magic-bulk": { hp: 1, strength: 0, spirit: 2, defense: 1.2, speed: 0.3 },

  "mixed-offense": { hp: 0.2, strength: 1.5, spirit: 1.5, defense: 0.2, speed: 1 },

  tank: { hp: 1.6, strength: 0, spirit: 0, defense: 2, speed: 0.25 },
  "fast-tank": { hp: 1, strength: 0, spirit: 0, defense: 1.3, speed: 1.7 },
  "hp-speed": { hp: 1.6, strength: 0, spirit: 0, defense: 0.2, speed: 1.6 },
};

export const SCORE_PROFILE_LABELS: Record<ScoreProfileId, string> = {
  balanced: "バランス（均等）",
  hp: "HP特化",
  strength: "ちから特化",
  spirit: "ようりょく特化",
  defense: "まもり特化",
  speed: "すばやさ特化",
  physical: "物理アタッカー",
  magic: "妖術アタッカー",
  "physical-speed": "高速物理アタッカー",
  "magic-speed": "高速妖術アタッカー",
  "physical-bulk": "耐久物理アタッカー",
  "magic-bulk": "耐久妖術アタッカー",
  "mixed-offense": "両刀アタッカー",
  tank: "壁・耐久",
  "fast-tank": "高速耐久",
  "hp-speed": "HP＋すばやさ",
};

function balancedScore(iv: StatBlock): number {
  const weightedPoints = [
    iv.hp / 2,
    iv.strength,
    iv.spirit,
    iv.defense,
    iv.speed,
  ];
  const ideal = 8;
  const totalDistance = weightedPoints.reduce(
    (sum, value) => sum + Math.abs(value - ideal),
    0,
  );

  return 40 - totalDistance / 2;
}

export function scoreIv(iv: StatBlock, profile: ScoreProfileId): number {
  if (profile === "balanced") {
    return balancedScore(iv);
  }

  const weights = PROFILES[profile];
  return (
    (iv.hp / 2) * weights.hp +
    iv.strength * weights.strength +
    iv.spirit * weights.spirit +
    iv.defense * weights.defense +
    iv.speed * weights.speed
  );
}
