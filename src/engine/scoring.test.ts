import { describe, expect, it } from "vitest";
import { SCORE_PROFILE_LABELS, scoreIv } from "./scoring";
import type { ScoreProfileId, StatBlock } from "./types";

const balanced: StatBlock = {
  hp: 16,
  strength: 8,
  spirit: 8,
  defense: 8,
  speed: 8,
};

describe("IV scoring profiles", () => {
  it("exposes a broad set of evaluation axes", () => {
    expect(Object.keys(SCORE_PROFILE_LABELS)).toHaveLength(16);
  });

  it("makes balanced scoring prefer an even weighted spread", () => {
    const skewed: StatBlock = {
      hp: 80,
      strength: 0,
      spirit: 0,
      defense: 0,
      speed: 0,
    };

    expect(scoreIv(balanced, "balanced")).toBe(40);
    expect(scoreIv(skewed, "balanced")).toBe(8);
    expect(scoreIv(balanced, "balanced")).toBeGreaterThan(scoreIv(skewed, "balanced"));
  });

  it("lets single-stat profiles distinguish opposite specializations", () => {
    const strengthHeavy: StatBlock = {
      hp: 0,
      strength: 40,
      spirit: 0,
      defense: 0,
      speed: 0,
    };
    const speedHeavy: StatBlock = {
      hp: 0,
      strength: 0,
      spirit: 0,
      defense: 0,
      speed: 40,
    };

    expect(scoreIv(strengthHeavy, "strength")).toBeGreaterThan(
      scoreIv(speedHeavy, "strength"),
    );
    expect(scoreIv(speedHeavy, "speed")).toBeGreaterThan(
      scoreIv(strengthHeavy, "speed"),
    );
  });

  it("returns a finite score for every profile", () => {
    for (const profile of Object.keys(SCORE_PROFILE_LABELS) as ScoreProfileId[]) {
      expect(Number.isFinite(scoreIv(balanced, profile))).toBe(true);
    }
  });
});
