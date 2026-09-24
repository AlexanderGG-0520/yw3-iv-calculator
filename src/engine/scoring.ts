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

  debuffer: { hp: 0.9, strength: 0.15, spirit: 0.15, defense: 0.8, speed: 2.4 },
  buffer: { hp: 1.3, strength: 0.1, spirit: 0.1, defense: 0.7, speed: 2.1 },
  healer: { hp: 0.9, strength: 0, spirit: 2.2, defense: 0.7, speed: 1.2 },
  "fast-healer": { hp: 0.5, strength: 0, spirit: 1.8, defense: 0.4, speed: 2.2 },
  "bulky-healer": { hp: 1.5, strength: 0, spirit: 1.8, defense: 1.3, speed: 0.4 },
  reviver: { hp: 1.1, strength: 0, spirit: 1.5, defense: 0.8, speed: 1.8 },
  "passive-support": { hp: 1.8, strength: 0, spirit: 0, defense: 1.6, speed: 0.5 },
  "utility-support": { hp: 0.8, strength: 0, spirit: 0, defense: 0.7, speed: 2.2 },
  "support-healer": { hp: 1, strength: 0, spirit: 1.6, defense: 0.6, speed: 1.7 },
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
  debuffer: "悪とりつき役（妨害）",
  buffer: "良とりつき役（バフ）",
  healer: "ヒーラー",
  "fast-healer": "高速ヒーラー",
  "bulky-healer": "耐久ヒーラー",
  reviver: "復活・立て直し役",
  "passive-support": "常駐サポート",
  "utility-support": "高速ユーティリティ",
  "support-healer": "回復＋支援",
};

export const SCORE_PROFILE_DESCRIPTIONS: Record<ScoreProfileId, string> = {
  balanced: "5つの加重点を8ずつに近づける均等型。",
  hp: "HP個体値だけを評価。",
  strength: "ちから個体値だけを評価。",
  spirit: "ようりょく個体値だけを評価。",
  defense: "まもり個体値だけを評価。",
  speed: "すばやさ個体値だけを評価。",
  physical: "ちからを軸に、すばやさと最低限の耐久も評価。",
  magic: "ようりょくを軸に、すばやさと最低限の耐久も評価。",
  "physical-speed": "ちからとすばやさを最優先する速攻物理型。",
  "magic-speed": "ようりょくとすばやさを最優先する速攻妖術型。",
  "physical-bulk": "ちからを維持しつつHP・まもりも確保する物理型。",
  "magic-bulk": "ようりょくを維持しつつHP・まもりも確保する妖術型。",
  "mixed-offense": "ちから・ようりょくの両方とすばやさを評価。",
  tank: "HPとまもりを最優先して前線維持を評価。",
  "fast-tank": "耐久とすばやさを両立する壁役向け。",
  "hp-speed": "HPとすばやさの両立だけを強く評価。",
  debuffer: "悪とりつきを早く回す想定。すばやさを最重視し、HP・まもりで場持ちも評価。",
  buffer: "味方への良とりつきを継続する想定。HP＋すばやさを中心に、最低限のまもりも評価。",
  healer: "回復量に関わるようりょくを最重視し、行動回数と生存力も評価。",
  "fast-healer": "すばやさとようりょくを強く評価し、先に回復を通すことを重視。",
  "bulky-healer": "HP・まもり・ようりょくを重視し、倒されにくい回復役を評価。",
  reviver: "復活・立て直し行動を通すため、すばやさ・生存力・ようりょくをバランス良く評価。",
  "passive-support": "スキルや陣などを維持する想定。HP・まもりを最重視して場残りを評価。",
  "utility-support": "妨害必殺や特殊支援などを早く回す想定。すばやさを最重視し、最低限の耐久も評価。",
  "support-healer": "回復とバフ・支援を兼任する想定。ようりょく・すばやさ・HPをバランス良く評価。",
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
