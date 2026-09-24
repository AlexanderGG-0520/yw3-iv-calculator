import type { YokaiSpecies } from "./types";

// Fallback dataset. Run `npm run sync:yokai` to regenerate the complete YW3 source table.
export const GENERATED_YOKAI: readonly YokaiSpecies[] = [
  { id: "yw3-001", number: 1, name: "アチャー", baseA: { hp: 42, strength: 27, spirit: 2, defense: 4, speed: 19 }, baseB: { hp: 341, strength: 192, spirit: 37, defense: 54, speed: 176 }, source: "togenyan-yw3" },
  { id: "yw3-243", number: 243, name: "ジバニャン", baseA: { hp: 65, strength: 20, spirit: 5, defense: 9, speed: 29 }, baseB: { hp: 332, strength: 167, spirit: 43, defense: 104, speed: 216 }, source: "togenyan-yw3" },
  { id: "yw3-245", number: 245, name: "ジバニャンS", baseA: { hp: 54, strength: 29, spirit: 9, defense: 11, speed: 44 }, baseB: { hp: 379, strength: 235, spirit: 58, defense: 108, speed: 229 }, source: "togenyan-yw3" },
  { id: "yw3-251", number: 251, name: "コマさん", baseA: { hp: 41, strength: 4, spirit: 26, defense: 9, speed: 21 }, baseB: { hp: 343, strength: 40, spirit: 190, defense: 102, speed: 160 }, source: "togenyan-yw3" },
  { id: "yw3-257", number: 257, name: "コマじろう", baseA: { hp: 46, strength: 7, spirit: 23, defense: 15, speed: 17 }, baseB: { hp: 372, strength: 53, spirit: 167, defense: 141, speed: 137 }, source: "togenyan-yw3" }
];
