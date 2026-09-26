import {
  calculateStats,
  isValidIvSpread,
  isValidRankUpCount,
  ivWeightedTotal,
} from "./engine/calculationEngine";
import { fitnessFromSessions, isValidSportsSessions } from "./engine/fitness";
import { SCORE_PROFILE_DESCRIPTIONS, SCORE_PROFILE_LABELS } from "./engine/scoring";
import {
  STAT_KEYS,
  type ScoreProfileId,
  type SearchInput,
  type SearchResponse,
  type SportsSessions,
  type StatBlock,
  type YokaiSpecies,
} from "./engine/types";
import { getYokaiSpecies, YOKAI } from "./engine/yokaiData";

type ToolExecuteOptions = { signal: AbortSignal };

export interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
    debugging?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    options: ToolExecuteOptions,
  ) => Promise<unknown> | unknown;
}

interface ModelContextLike {
  registerTool(
    tool: WebMcpTool,
    options?: { signal?: AbortSignal },
  ): Promise<unknown>;
}

export interface ForwardCalculationInput {
  speciesId: string;
  level: number;
  rankUps: number;
  iv: StatBlock;
  sessions: SportsSessions;
  equipment: StatBlock;
}

export interface WebMcpBindings {
  onReverseSearch: (input: SearchInput, response: SearchResponse) => void;
  onForwardCalculation: (input: ForwardCalculationInput, stats: StatBlock) => void;
}

type ReverseSearchRunner = (
  input: SearchInput,
  signal: AbortSignal,
) => Promise<SearchResponse>;

type WorkerResponse =
  | { ok: true; response: SearchResponse }
  | { ok: false; error: string };

const SCORE_PROFILE_IDS = Object.keys(SCORE_PROFILE_LABELS) as ScoreProfileId[];
const ZERO_SESSIONS: SportsSessions = {
  strength: 0,
  spirit: 0,
  defense: 0,
  speed: 0,
};
const ZERO_BLOCK: StatBlock = {
  hp: 0,
  strength: 0,
  spirit: 0,
  defense: 0,
  speed: 0,
};

const statBlockSchema = {
  type: "object",
  properties: {
    hp: { type: "integer" },
    strength: { type: "integer" },
    spirit: { type: "integer" },
    defense: { type: "integer" },
    speed: { type: "integer" },
  },
  required: ["hp", "strength", "spirit", "defense", "speed"],
  additionalProperties: false,
};

const sessionsSchema = {
  type: "object",
  properties: {
    strength: { type: "integer", minimum: 0, maximum: 5 },
    spirit: { type: "integer", minimum: 0, maximum: 5 },
    defense: { type: "integer", minimum: 0, maximum: 5 },
    speed: { type: "integer", minimum: 0, maximum: 5 },
  },
  additionalProperties: false,
};

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function integer(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new RangeError(`${label} must be an integer from ${minimum} through ${maximum}.`);
  }
  return value as number;
}

function statBlock(value: unknown, label: string): StatBlock {
  const record = asRecord(value, label);
  return {
    hp: integer(record.hp, `${label}.hp`, -999, 999),
    strength: integer(record.strength, `${label}.strength`, -999, 999),
    spirit: integer(record.spirit, `${label}.spirit`, -999, 999),
    defense: integer(record.defense, `${label}.defense`, -999, 999),
    speed: integer(record.speed, `${label}.speed`, -999, 999),
  };
}

function sessions(value: unknown): SportsSessions {
  if (value === undefined) return { ...ZERO_SESSIONS };
  const record = asRecord(value, "sessions");
  const result: SportsSessions = {
    strength: integer(record.strength ?? 0, "sessions.strength", 0, 5),
    spirit: integer(record.spirit ?? 0, "sessions.spirit", 0, 5),
    defense: integer(record.defense ?? 0, "sessions.defense", 0, 5),
    speed: integer(record.speed ?? 0, "sessions.speed", 0, 5),
  };
  if (!isValidSportsSessions(result)) {
    throw new RangeError("Sports Club sessions may total at most five.");
  }
  return result;
}

function equipment(value: unknown): StatBlock {
  if (value === undefined) return { ...ZERO_BLOCK };
  return statBlock(value, "equipment");
}

function resolveSpecies(value: unknown): YokaiSpecies {
  if (typeof value === "number") {
    if (!Number.isInteger(value)) throw new TypeError("species number must be an integer.");
    const match = YOKAI.find((entry) => entry.number === value);
    if (!match) throw new Error(`No Yo-kai found with number ${value}.`);
    return match;
  }

  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError("species must be a Yo-kai id, number, or name.");
  }

  const query = value.trim().toLowerCase();
  const exact = YOKAI.find(
    (entry) =>
      entry.id.toLowerCase() === query ||
      entry.name.toLowerCase() === query ||
      String(entry.number) === query,
  );
  if (exact) return exact;

  const partial = YOKAI.filter(
    (entry) =>
      entry.name.toLowerCase().includes(query) ||
      entry.id.toLowerCase().includes(query),
  );

  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    const examples = partial
      .slice(0, 8)
      .map((entry) => `${entry.number}. ${entry.name} (${entry.id})`)
      .join(", ");
    throw new Error(
      `species is ambiguous. Use search_yokai first. Matches include: ${examples}`,
    );
  }

  throw new Error(`No Yo-kai matched "${value}". Use search_yokai to find the id.`);
}

function scoreProfile(value: unknown): ScoreProfileId {
  const profile = value === undefined ? "balanced" : value;
  if (
    typeof profile !== "string" ||
    !SCORE_PROFILE_IDS.includes(profile as ScoreProfileId)
  ) {
    throw new RangeError(
      `Unknown scoreProfile. Use one of: ${SCORE_PROFILE_IDS.join(", ")}.`,
    );
  }
  return profile as ScoreProfileId;
}

function parseForwardInput(raw: Record<string, unknown>): ForwardCalculationInput {
  const species = resolveSpecies(raw.species);
  const level = integer(raw.level, "level", 1, 99);
  const rankUps = integer(raw.rankUps ?? 0, "rankUps", 0, 5);
  if (!isValidRankUpCount(rankUps)) {
    throw new RangeError("rankUps must be an integer from 0 through 5.");
  }

  const iv = statBlock(raw.iv, "iv");
  if (!isValidIvSpread(iv)) {
    throw new RangeError(
      "IVs must satisfy HP/2 + strength + spirit + defense + speed = 40; HP must be even 0-80 and other IVs 0-40.",
    );
  }

  return {
    speciesId: species.id,
    level,
    rankUps,
    iv,
    sessions: sessions(raw.sessions),
    equipment: equipment(raw.equipment),
  };
}

function parseReverseInput(raw: Record<string, unknown>): SearchInput {
  const species = resolveSpecies(raw.species);
  const observed = statBlock(raw.observed, "observed");
  if (STAT_KEYS.some((stat) => observed[stat] < 1)) {
    throw new RangeError("All observed stats must be positive integers.");
  }

  return {
    speciesId: species.id,
    level: integer(raw.level, "level", 1, 99),
    rankUps: integer(raw.rankUps ?? 0, "rankUps", 0, 5),
    observed,
    sessions: sessions(raw.sessions),
    equipment: equipment(raw.equipment),
    scoreProfile: scoreProfile(raw.scoreProfile),
    maxResults: 200,
  };
}

export function searchYokai(query: string, limit = 20) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) throw new TypeError("query must not be empty.");

  const matches = YOKAI.filter(
    (entry) =>
      entry.name.toLowerCase().includes(normalized) ||
      entry.id.toLowerCase().includes(normalized) ||
      String(entry.number).includes(normalized),
  );

  return {
    totalMatches: matches.length,
    matches: matches.slice(0, limit).map(({ id, number, name }) => ({
      id,
      number,
      name,
    })),
  };
}

async function runReverseSearchWorker(
  input: SearchInput,
  signal: AbortSignal,
): Promise<SearchResponse> {
  if (signal.aborted) {
    throw signal.reason ?? new DOMException("Tool execution aborted.", "AbortError");
  }

  return new Promise<SearchResponse>((resolve, reject) => {
    const worker = new Worker(
      new URL("./workers/reverseSearch.worker.ts", import.meta.url),
      { type: "module" },
    );

    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      worker.terminate();
    };
    const onAbort = () => {
      cleanup();
      reject(signal.reason ?? new DOMException("Tool execution aborted.", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      cleanup();
      if (event.data.ok) {
        resolve(event.data.response);
      } else {
        reject(new Error(event.data.error));
      }
    };
    worker.onerror = (event) => {
      cleanup();
      reject(new Error(event.message || "Reverse-search worker failed."));
    };
    worker.postMessage(input);
  });
}

export function createWebMcpTools(
  bindings: WebMcpBindings,
  runReverse: ReverseSearchRunner = runReverseSearchWorker,
): WebMcpTool[] {
  return [
    {
      name: "search_yokai",
      title: "妖怪を検索",
      description:
        "Search the built-in Yo-kai Watch 3 species dataset by Japanese name, internal id, or encyclopedia number. Use this before calculation when the species id is unknown or a name is ambiguous.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            minLength: 1,
            description: "Yo-kai name, partial name, internal id, or encyclopedia number.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 20,
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
        consequentialHint: false,
      },
      execute: async (raw) => {
        const query = raw.query;
        if (typeof query !== "string") throw new TypeError("query must be a string.");
        const limit = raw.limit === undefined ? 20 : integer(raw.limit, "limit", 1, 50);
        return searchYokai(query, limit);
      },
    },
    {
      name: "list_evaluation_profiles",
      title: "評価役割を一覧",
      description:
        "List every IV evaluation profile supported by the calculator, including battle-role profiles such as debuffer, buffer, healer, tank, and support roles. Use this to choose scoreProfile for reverse_iv.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
        consequentialHint: false,
      },
      execute: async () =>
        SCORE_PROFILE_IDS.map((id) => ({
          id,
          label: SCORE_PROFILE_LABELS[id],
          description: SCORE_PROFILE_DESCRIPTIONS[id],
        })),
    },
    {
      name: "calculate_stats",
      title: "ステータスを順計算",
      description:
        "Calculate Yo-kai Watch 3 stats from species, level, rank-up treasure count, a valid 40-point IV spread, Sports Club sessions, and equipment modifiers. The result is also loaded into the page's forward calculator so the user can inspect it.",
      inputSchema: {
        type: "object",
        properties: {
          species: {
            type: ["string", "integer"],
            description: "Yo-kai id, encyclopedia number, or exact/unique name.",
          },
          level: { type: "integer", minimum: 1, maximum: 99 },
          rankUps: { type: "integer", minimum: 0, maximum: 5, default: 0 },
          iv: statBlockSchema,
          sessions: sessionsSchema,
          equipment: statBlockSchema,
        },
        required: ["species", "level", "iv"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
        consequentialHint: false,
      },
      execute: async (raw) => {
        const input = parseForwardInput(raw);
        const species = getYokaiSpecies(input.speciesId);
        const stats = calculateStats(
          species,
          input.level,
          input.rankUps,
          input.iv,
          fitnessFromSessions(input.sessions),
          input.equipment,
        );
        bindings.onForwardCalculation(input, stats);
        return {
          species: { id: species.id, number: species.number, name: species.name },
          level: input.level,
          rankUps: input.rankUps,
          iv: input.iv,
          ivWeightedTotal: ivWeightedTotal(input.iv),
          sessions: input.sessions,
          equipment: input.equipment,
          stats,
        };
      },
    },
    {
      name: "reverse_iv",
      title: "個体値を逆算",
      description:
        "Reverse-calculate and rank Yo-kai Watch 3 IV candidates from observed stats. scoreProfile controls which role/build is preferred. The complete search is run before truncating to the best 200, and the result is loaded into the visible reverse calculator.",
      inputSchema: {
        type: "object",
        properties: {
          species: {
            type: ["string", "integer"],
            description: "Yo-kai id, encyclopedia number, or exact/unique name.",
          },
          level: { type: "integer", minimum: 1, maximum: 99 },
          rankUps: { type: "integer", minimum: 0, maximum: 5, default: 0 },
          observed: statBlockSchema,
          sessions: sessionsSchema,
          equipment: statBlockSchema,
          scoreProfile: {
            type: "string",
            enum: SCORE_PROFILE_IDS,
            default: "balanced",
            description:
              "IV ranking profile. Call list_evaluation_profiles if unsure which role id to use.",
          },
        },
        required: ["species", "level", "observed"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
        consequentialHint: false,
      },
      execute: async (raw, { signal }) => {
        const input = parseReverseInput(raw);
        const response = await runReverse(input, signal);
        bindings.onReverseSearch(input, response);
        const species = getYokaiSpecies(input.speciesId);
        return {
          species: { id: species.id, number: species.number, name: species.name },
          scoreProfile: {
            id: input.scoreProfile,
            label: SCORE_PROFILE_LABELS[input.scoreProfile],
            description: SCORE_PROFILE_DESCRIPTIONS[input.scoreProfile],
          },
          summary: response.summary,
          topResults: response.results.slice(0, 20),
          displayedResultCount: response.results.length,
        };
      },
    },
  ];
}

export function registerWebMcpTools(bindings: WebMcpBindings): () => void {
  const modelContext = (
    document as Document & { modelContext?: ModelContextLike }
  ).modelContext;

  if (!modelContext) return () => {};

  const controller = new AbortController();
  const tools = createWebMcpTools(bindings);

  void Promise.all(
    tools.map((tool) =>
      modelContext.registerTool(tool, { signal: controller.signal }),
    ),
  ).catch((error) => {
    if (!controller.signal.aborted) {
      console.warn("Failed to register WebMCP site tools.", error);
    }
  });

  return () => controller.abort();
}
