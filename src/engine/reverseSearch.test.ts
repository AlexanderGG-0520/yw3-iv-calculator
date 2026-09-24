import { describe, expect, it } from "vitest";
import { reverseSearch } from "./reverseSearch";

describe("YW3 reverseSearch", () => {
  it("finds the fixed balanced IV spread from the published Jibanyan fixture", () => {
    const response = reverseSearch({
      speciesId: "yw3-243",
      level: 50,
      rankUps: 4,
      observed: { hp: 254, strength: 145, spirit: 33, defense: 64, speed: 156 },
      sessions: { strength: 5, spirit: 0, defense: 0, speed: 0 },
      equipment: { hp: 0, strength: 0, spirit: 0, defense: 0, speed: 0 },
      scoreProfile: "balanced",
      maxResults: 500,
    });

    expect(response.summary.validCandidateCount).toBeGreaterThan(0);
    expect(response.results.some((result) =>
      result.iv.hp === 16 &&
      result.iv.strength === 8 &&
      result.iv.spirit === 8 &&
      result.iv.defense === 8 &&
      result.iv.speed === 8
    )).toBe(true);
  });
});
