import { describe, expect, it, vi } from "vitest";
import { createWebMcpTools, searchYokai } from "./webmcp";
import type { SearchResponse } from "./engine/types";

const abortSignal = () => new AbortController().signal;

describe("WebMCP site tools", () => {
  it("exposes the four intended tools", () => {
    const tools = createWebMcpTools({
      onReverseSearch: vi.fn(),
      onForwardCalculation: vi.fn(),
    }, async () => {
      throw new Error("not used");
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      "search_yokai",
      "list_evaluation_profiles",
      "calculate_stats",
      "reverse_iv",
    ]);
  });

  it("searches species by Japanese name", () => {
    const result = searchYokai("ジバニャン", 10);
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(result.matches.some((entry) => entry.name === "ジバニャン")).toBe(true);
  });

  it("calculates stats and mirrors the result into the forward UI binding", async () => {
    const onForwardCalculation = vi.fn();
    const tools = createWebMcpTools({
      onReverseSearch: vi.fn(),
      onForwardCalculation,
    }, async () => {
      throw new Error("not used");
    });
    const calculate = tools.find((tool) => tool.name === "calculate_stats");
    expect(calculate).toBeDefined();

    const result = await calculate!.execute({
      species: "ジバニャン",
      level: 50,
      rankUps: 4,
      iv: { hp: 16, strength: 8, spirit: 8, defense: 8, speed: 8 },
      sessions: { strength: 5, spirit: 0, defense: 0, speed: 0 },
    }, { signal: abortSignal() }) as { stats: Record<string, number> };

    expect(result.stats).toEqual({
      hp: 254,
      strength: 145,
      spirit: 33,
      defense: 64,
      speed: 156,
    });
    expect(onForwardCalculation).toHaveBeenCalledOnce();
  });

  it("runs reverse search with the selected role and mirrors it into the UI binding", async () => {
    const response: SearchResponse = {
      results: [{
        id: "1",
        iv: { hp: 16, strength: 8, spirit: 8, defense: 8, speed: 8 },
        calculated: { hp: 254, strength: 145, spirit: 33, defense: 64, speed: 156 },
        score: 40,
      }],
      summary: {
        perStatCandidateCounts: { hp: 1, strength: 1, spirit: 1, defense: 1, speed: 1 },
        combinationsVisited: 1,
        validCandidateCount: 1,
        truncated: false,
      },
    };
    const runner = vi.fn(async () => response);
    const onReverseSearch = vi.fn();
    const tools = createWebMcpTools({
      onReverseSearch,
      onForwardCalculation: vi.fn(),
    }, runner);
    const reverse = tools.find((tool) => tool.name === "reverse_iv");
    expect(reverse).toBeDefined();

    const result = await reverse!.execute({
      species: "ジバニャン",
      level: 50,
      rankUps: 4,
      observed: { hp: 254, strength: 145, spirit: 33, defense: 64, speed: 156 },
      sessions: { strength: 5, spirit: 0, defense: 0, speed: 0 },
      scoreProfile: "healer",
    }, { signal: abortSignal() }) as {
      scoreProfile: { id: string };
      topResults: unknown[];
    };

    expect(runner).toHaveBeenCalledOnce();
    expect(onReverseSearch).toHaveBeenCalledOnce();
    expect(result.scoreProfile.id).toBe("healer");
    expect(result.topResults).toHaveLength(1);
  });
});
