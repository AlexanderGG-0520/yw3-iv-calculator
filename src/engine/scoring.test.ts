import { describe, expect, it } from "vitest";
import {
  SCORE_PROFILE_DESCRIPTIONS,
  SCORE_PROFILE_LABELS,
  scoreIv,
} from "./scoring";
import type { ScoreProfileId, StatBlock } from "./types";

const balanced: StatBlock = {
  hp: 16,
  strength: 8,
  spirit: 8,
  defense: 8,
  speed: 8,
};

describe("IV scoring profiles", () => {
  it("exposes broad stat and battle-role evaluation axes", () => {
    expect(Object.keys(SCORE_PROFILE_LABELS)).toHaveLength(25);
    expect(SCORE_PROFILE_LABELS.debuffer).toBe("悪とりつき役（妨害）");
    expect(SCORE_PROFILE_LABELS.buffer).toBe("良とりつき役（バフ）");
    expect(SCORE_PROFILE_LABELS.healer).toBe("ヒーラー");
    expect(SCORE_PROFILE_LABELS["passive-support"]).toBe("常駐サポート");
  });

  it("documents every scoring profile", () => {
    for (const profile of Object.keys(SCORE_PROFILE_LABELS) as ScoreProfileId[]) {
      expect(SCORE_PROFILE_DESCRIPTIONS[profile].length).toBeGreaterThan(0);
    }
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
    expect(scoreIv(speedHeavy, "debuffer")).toBeGreaterThan(
      scoreIv(strengthHeavy, "debuffer"),
    );
  });

  it("makes healer roles value spirit over irrelevant physical offense", () => {
    const spiritHeavy: StatBlock = {
      hp: 0,
      strength: 0,
      spirit: 40,
      defense: 0,
      speed: 0,
    };
    const strengthHeavy: StatBlock = {
      hp: 0,
      strength: 40,
      spirit: 0,
      defense: 0,
      speed: 0,
    };

    expect(scoreIv(spiritHeavy, "healer")).toBeGreaterThan(
      scoreIv(strengthHeavy, "healer"),
    );
    expect(scoreIv(spiritHeavy, "support-healer")).toBeGreaterThan(
      scoreIv(strengthHeavy, "support-healer"),
    );
  });

  it("makes passive support prefer survivability to pure speed", () => {
    const bulky: StatBlock = {
      hp: 40,
      strength: 0,
      spirit: 0,
      defense: 20,
      speed: 0,
    };
    const fast: StatBlock = {
      hp: 0,
      strength: 0,
      spirit: 0,
      defense: 0,
      speed: 40,
    };

    expect(scoreIv(bulky, "passive-support")).toBeGreaterThan(
      scoreIv(fast, "passive-support"),
    );
  });

  it("returns a finite score for every profile", () => {
    for (const profile of Object.keys(SCORE_PROFILE_LABELS) as ScoreProfileId[]) {
      expect(Number.isFinite(scoreIv(balanced, profile))).toBe(true);
    }
  });
});
