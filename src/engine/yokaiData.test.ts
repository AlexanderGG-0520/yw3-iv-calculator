import { describe, expect, it } from "vitest";
import { YOKAI } from "./yokaiData";

describe("YW3 checked-in fallback data", () => {
  it("contains the complete version 4.0 dataset", () => {
    expect(YOKAI).toHaveLength(698);
    expect(new Set(YOKAI.map((entry) => entry.id)).size).toBe(698);
    expect(YOKAI[0]?.id).toBe("yw3-001");
    expect(YOKAI.at(-1)?.number).toBeGreaterThanOrEqual(698);
  });
});
