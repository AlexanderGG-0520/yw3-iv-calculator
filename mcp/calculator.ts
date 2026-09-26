import {
  calculateStats,
  isValidIvSpread,
  isValidRankUpCount,
  ivWeightedTotal,
} from "../src/engine/calculationEngine";
import { fitnessFromSessions, isValidSportsSessions } from "../src/engine/fitness";
import { reverseSearch } from "../src/engine/reverseSearch";
import {
  SCORE_PROFILE_DESCRIPTIONS,
  SCORE_PROFILE_LABELS,
} from "../src/engine/scoring";
import {
  STAT_KEYS,
  type ScoreProfileId,
  type SearchInput,
  type SportsSessions,
  type StatBlock,
  type YokaiSpecies,
} from "../src/engine/types";
import { getYokaiSpecies, YOKAI } from "../src/engine/yokaiData";

export const SCORE_PROFILE_IDS = [
  "balanced",
  "hp",
  "strength",
  "spirit",
  "defense",
  "speed",
  "physical",
  "magic",
  "physical-speed",
  "magic-speed",
  "physical-bulk",
  "magic-bulk",
  "mixed-offense",
  "tank",
  "fast-tank",
  "hp-speed",
  "debuffer",
  "buffer",
  "healer",
  "fast-healer",
  "bulky-healer",
  "reviver",
  "passive-support",
  "utility-support",
  "support-healer",
] as const satisfies readonly ScoreProfileId[];

const zeroBlock = (): StatBlock => ({
  hp: 0,
  strength: 0,
  spirit: 0,
  defense: 0,
  speed: 0,
});

const zeroSessions = (): SportsSessions => ({
  strength: 0,
  spirit: 0,
  defense: 0,
  speed: 0,
});

function requireLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 99) {
    throw new RangeError("level must be an integer from 1 through 99.");
  }
  return level;
}

function requireRankUps(rankUps: number): number {
  if (!isValidRankUpCount(rankUps)) {
    throw new RangeError("rankUps must be an integer from 0 through 5.");
  }
  return rankUps;
}

function normalizeSessions(value?: Partial<SportsSessions>): SportsSessions {
  const result = { ...zeroSessions(), ...value };
  if (!isValidSportsSessions(result)) {
    throw new RangeError(
      "Sports Club sessions must be integers from 0 through 5 and may total at most five.",
    );
  }
  return result;
}

function normalizeEquipment(value?: Partial<StatBlock>): StatBlock {
  const result = { ...zeroBlock(), ...value };
  if (STAT_KEYS.some((stat) => !Number.isInteger(result[stat]))) {
    throw new RangeError("Equipment modifiers must be integers.");
  }
  return result;
}

function requireObserved(observed: StatBlock): StatBlock {
  if (
    STAT_KEYS.some(
      (stat) => !Number.isInteger(observed[stat]) || observed[stat] < 1,
    )
  ) {
    throw new RangeError("All observed stats must be positive integers.");
  }
  return observed;
}

function requireScoreProfile(value?: ScoreProfileId): ScoreProfileId {
  const profile = value ?? "balanced";
  if (!SCORE_PROFILE_IDS.includes(profile)) {
    throw new RangeError("Unknown scoreProfile: " + profile);
  }
  return profile;
}

function speciesSummary(species: YokaiSpecies) {
  return {
    id: species.id,
    number: species.number,
    name: species.name,
  };
}

export function resolveSpecies(query: string | number): YokaiSpecies {
  if (typeof query === "number") {
    if (!Number.isInteger(query)) {
      throw new TypeError("species number must be an integer.");
    }
    const byNumber = YOKAI.find((entry) => entry.number === query);
    if (!byNumber) throw new Error("No Yo-kai found with number " + query + ".");
    return byNumber;
  }

  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    throw new TypeError("species must be a non-empty name, id, or number.");
  }

  const exact = YOKAI.find(
    (entry) =>
      entry.id.toLowerCase() === normalized ||
      entry.name.toLowerCase() === normalized ||
      String(entry.number) === normalized,
  );
  if (exact) return exact;

  const partial = YOKAI.filter(
    (entry) =>
      entry.name.toLowerCase().includes(normalized) ||
      entry.id.toLowerCase().includes(normalized),
  );

  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    const examples = partial
      .slice(0, 8)
      .map((entry) => entry.number + ". " + entry.name + " (" + entry.id + ")")
      .join(", ");
    throw new Error(
      "species is ambiguous. Use search_yokai first. Matches include: " + examples,
    );
  }

  throw new Error(
    'No Yo-kai matched "' + query + '". Use search_yokai to find the id.',
  );
}

export function searchYokai(query: string, limit = 20) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) throw new TypeError("query must not be empty.");
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError("limit must be an integer from 1 through 50.");
  }

  const matches = YOKAI.filter(
    (entry) =>
      entry.name.toLowerCase().includes(normalized) ||
      entry.id.toLowerCase().includes(normalized) ||
      String(entry.number).includes(normalized),
  );

  return {
    totalMatches: matches.length,
    matches: matches.slice(0, limit).map(speciesSummary),
  };
}

export function listEvaluationProfiles() {
  return {
    profiles: SCORE_PROFILE_IDS.map((id) => ({
      id,
      label: SCORE_PROFILE_LABELS[id],
      description: SCORE_PROFILE_DESCRIPTIONS[id],
    })),
  };
}

export interface ForwardToolInput {
  species: string | number;
  level: number;
  rankUps?: number;
  iv: StatBlock;
  sessions?: Partial<SportsSessions>;
  equipment?: Partial<StatBlock>;
}

export function calculateStatsTool(input: ForwardToolInput) {
  const species = resolveSpecies(input.species);
  const level = requireLevel(input.level);
  const rankUps = requireRankUps(input.rankUps ?? 0);
  if (!isValidIvSpread(input.iv)) {
    throw new RangeError(
      "IVs must satisfy HP/2 + strength + spirit + defense + speed = 40; HP must be even 0-80 and other IVs 0-40.",
    );
  }
  const sessions = normalizeSessions(input.sessions);
  const equipment = normalizeEquipment(input.equipment);
  const stats = calculateStats(
    getYokaiSpecies(species.id),
    level,
    rankUps,
    input.iv,
    fitnessFromSessions(sessions),
    equipment,
  );

  return {
    species: speciesSummary(species),
    level,
    rankUps,
    iv: input.iv,
    ivWeightedTotal: ivWeightedTotal(input.iv),
    sessions,
    equipment,
    stats,
  };
}

export interface ReverseToolInput {
  species: string | number;
  level: number;
  rankUps?: number;
  observed: StatBlock;
  sessions?: Partial<SportsSessions>;
  equipment?: Partial<StatBlock>;
  scoreProfile?: ScoreProfileId;
  maxResults?: number;
}

export function reverseIvTool(input: ReverseToolInput) {
  const species = resolveSpecies(input.species);
  const maxResults = input.maxResults ?? 20;
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 200) {
    throw new RangeError("maxResults must be an integer from 1 through 200.");
  }

  const request: SearchInput = {
    speciesId: species.id,
    level: requireLevel(input.level),
    rankUps: requireRankUps(input.rankUps ?? 0),
    observed: requireObserved(input.observed),
    sessions: normalizeSessions(input.sessions),
    equipment: normalizeEquipment(input.equipment),
    scoreProfile: requireScoreProfile(input.scoreProfile),
    maxResults,
  };

  const response = reverseSearch(request);

  return {
    species: speciesSummary(species),
    level: request.level,
    rankUps: request.rankUps,
    scoreProfile: {
      id: request.scoreProfile,
      label: SCORE_PROFILE_LABELS[request.scoreProfile],
      description: SCORE_PROFILE_DESCRIPTIONS[request.scoreProfile],
    },
    sessions: request.sessions,
    equipment: request.equipment,
    summary: response.summary,
    results: response.results,
  };
}
