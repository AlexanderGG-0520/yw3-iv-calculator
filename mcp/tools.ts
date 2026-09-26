import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import {
  SCORE_PROFILE_IDS,
  calculateStatsTool,
  listEvaluationProfiles,
  reverseIvTool,
  searchYokai,
} from "./calculator";

const speciesSchema = z
  .union([z.string().min(1), z.number().int().positive()])
  .describe("Yo-kai name, internal id, or encyclopedia number.");

const observedSchema = z
  .object({
    hp: z.number().int().min(1),
    strength: z.number().int().min(1),
    spirit: z.number().int().min(1),
    defense: z.number().int().min(1),
    speed: z.number().int().min(1),
  })
  .strict();

const equipmentSchema = z
  .object({
    hp: z.number().int().min(-999).max(999).default(0),
    strength: z.number().int().min(-999).max(999).default(0),
    spirit: z.number().int().min(-999).max(999).default(0),
    defense: z.number().int().min(-999).max(999).default(0),
    speed: z.number().int().min(-999).max(999).default(0),
  })
  .strict();

const sessionsSchema = z
  .object({
    strength: z.number().int().min(0).max(5).default(0),
    spirit: z.number().int().min(0).max(5).default(0),
    defense: z.number().int().min(0).max(5).default(0),
    speed: z.number().int().min(0).max(5).default(0),
  })
  .strict()
  .refine(
    (value) =>
      value.strength + value.spirit + value.defense + value.speed <= 5,
    "Sports Club sessions may total at most five.",
  );

const ivSchema = z
  .object({
    hp: z.number().int().min(0).max(80).refine((value) => value % 2 === 0, {
      message: "HP IV must be even.",
    }),
    strength: z.number().int().min(0).max(40),
    spirit: z.number().int().min(0).max(40),
    defense: z.number().int().min(0).max(40),
    speed: z.number().int().min(0).max(40),
  })
  .strict()
  .refine(
    (value) =>
      value.hp / 2 +
        value.strength +
        value.spirit +
        value.defense +
        value.speed ===
      40,
    "IVs must satisfy HP/2 + strength + spirit + defense + speed = 40.",
  );

function success(data: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
    structuredContent: data,
  };
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

export function registerCalculatorTools(server: McpServer): void {
  server.registerTool(
    "search_yokai",
    {
      title: "Search Yo-kai",
      description:
        "Search the built-in Yo-kai Watch 3 species dataset by Japanese name, internal id, or encyclopedia number. Use this before calculations when a species id is unknown or a name is ambiguous.",
      inputSchema: z.object({
        query: z
          .string()
          .min(1)
          .describe("Yo-kai name, partial name, internal id, or encyclopedia number."),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, limit }) => {
      try {
        return success(searchYokai(query, limit));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "list_evaluation_profiles",
    {
      title: "List IV evaluation profiles",
      description:
        "List all supported IV ranking profiles, including physical, magic, tank, debuffer, buffer, healer, reviver, and support roles. Use an id from this result as scoreProfile for reverse_iv.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => success(listEvaluationProfiles()),
  );

  server.registerTool(
    "calculate_stats",
    {
      title: "Calculate Yo-kai Watch 3 stats",
      description:
        "Forward-calculate Yo-kai Watch 3 stats from species, level, rank-up treasure count, a valid 40-point IV spread, Sports Club sessions, and equipment modifiers.",
      inputSchema: z.object({
        species: speciesSchema,
        level: z.number().int().min(1).max(99),
        rankUps: z.number().int().min(0).max(5).default(0),
        iv: ivSchema,
        sessions: sessionsSchema.optional(),
        equipment: equipmentSchema.optional(),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => {
      try {
        return success(calculateStatsTool(input));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "reverse_iv",
    {
      title: "Reverse-calculate IVs",
      description:
        "Reverse-calculate and rank Yo-kai Watch 3 IV candidates from observed stats. The search runs in an isolated worker thread so heavy searches do not block the MCP HTTP server. Choose scoreProfile with list_evaluation_profiles when role-specific ranking is needed.",
      inputSchema: z.object({
        species: speciesSchema,
        level: z.number().int().min(1).max(99),
        rankUps: z.number().int().min(0).max(5).default(0),
        observed: observedSchema,
        sessions: sessionsSchema.optional(),
        equipment: equipmentSchema.optional(),
        scoreProfile: z.enum(SCORE_PROFILE_IDS).default("balanced"),
        maxResults: z.number().int().min(1).max(200).default(20),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => {
      try {
        return success(await reverseIvTool(input));
      } catch (error) {
        return failure(error);
      }
    },
  );
}
