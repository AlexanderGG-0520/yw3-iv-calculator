export const STAT_KEYS = ["hp", "strength", "spirit", "defense", "speed"] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type StatBlock = Record<StatKey, number>;

export interface YokaiSpecies {
  id: string;
  number: number;
  name: string;
  baseA: StatBlock;
  baseB: StatBlock;
  source: "togenyan-yw3";
}

export interface SportsSessions {
  strength: number;
  spirit: number;
  defense: number;
  speed: number;
}

export type ScoreProfileId =
  | "balanced"
  | "hp"
  | "strength"
  | "spirit"
  | "defense"
  | "speed"
  | "physical"
  | "magic"
  | "physical-speed"
  | "magic-speed"
  | "physical-bulk"
  | "magic-bulk"
  | "mixed-offense"
  | "tank"
  | "fast-tank"
  | "hp-speed";

export interface SearchInput {
  speciesId: string;
  level: number;
  rankUps: number;
  observed: StatBlock;
  sessions: SportsSessions;
  equipment: StatBlock;
  scoreProfile: ScoreProfileId;
  maxResults: number;
}

export interface IvCandidate {
  stat: StatKey;
  iv: number;
  calculated: number;
}

export interface ReverseResult {
  id: string;
  iv: StatBlock;
  calculated: StatBlock;
  score: number;
}

export interface SearchSummary {
  perStatCandidateCounts: StatBlock;
  combinationsVisited: number;
  validCandidateCount: number;
  truncated: boolean;
}

export interface SearchResponse {
  results: ReverseResult[];
  summary: SearchSummary;
}
