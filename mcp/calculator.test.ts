import { describe, expect, it } from "vitest";
import {
  calculateStatsTool,
  listEvaluationProfiles,
  prepareReverseRequest,
  resolveSpecies,
  searchYokai,
} from "./calculator";

describe("remote MCP calculator tools", () => {
  it("searches the complete species dataset by Japanese name", () => {
    const result = searchYokai("ジバニャン", 20);
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(result.matches.some((entry) => entry.name === "ジバニャン")).toBe(true);
  });

  it("rejects duplicate exact names instead of silently taking the first row", () => {
    expect(() => resolveSpecies("ＵＳＡ()ピョン")).toThrow(
      /ambiguous.*423.*424/s,
    );
    expect(resolveSpecies(423).number).toBe(423);
    expect(resolveSpecies("yw3-423").number).toBe(423);
  });

  it("publishes all role-based evaluation profiles", () => {
    const result = listEvaluationProfiles();
    expect(result.profiles).toHaveLength(25);
    expect(result.profiles.some((profile) => profile.id === "debuffer")).toBe(true);
    expect(result.profiles.some((profile) => profile.id === "healer")).toBe(true);
  });

  it("reproduces the Jibanyan forward-calculation fixture", () => {
    const result = calculateStatsTool({
      species: "ジバニャン",
      level: 50,
      rankUps: 4,
      iv: { hp: 16, strength: 8, spirit: 8, defense: 8, speed: 8 },
      sessions: { strength: 5, spirit: 0, defense: 0, speed: 0 },
    });

    expect(result.stats).toEqual({
      hp: 254,
      strength: 145,
      spirit: 33,
      defense: 64,
      speed: 156,
    });
  });

  it("prepares role-specific reverse-search input for the worker", () => {
    const prepared = prepareReverseRequest({
      species: "ジバニャン",
      level: 50,
      rankUps: 4,
      observed: {
        hp: 254,
        strength: 145,
        spirit: 33,
        defense: 64,
        speed: 156,
      },
      sessions: { strength: 5, spirit: 0, defense: 0, speed: 0 },
      scoreProfile: "healer",
      maxResults: 20,
    });

    expect(prepared.species.name).toBe("ジバニャン");
    expect(prepared.request.scoreProfile).toBe("healer");
    expect(prepared.request.maxResults).toBe(20);
  });
});
