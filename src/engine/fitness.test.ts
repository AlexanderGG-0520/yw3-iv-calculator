import { describe, expect, it } from "vitest";
import { fitnessFromSessions, isValidSportsSessions, totalSessions } from "./fitness";

describe("YW3 Sports Club", () => {
  it("applies the documented session effects", () => {
    expect(fitnessFromSessions({ strength: 1, spirit: 1, defense: 1, speed: 1 })).toEqual({
      hp: 0,
      strength: 5,
      spirit: 5,
      defense: 1,
      speed: 1,
    });
  });

  it("counts all four session categories against the shared five-session limit", () => {
    expect(totalSessions({ strength: 2, spirit: 1, defense: 1, speed: 1 })).toBe(5);
    expect(isValidSportsSessions({ strength: 2, spirit: 1, defense: 1, speed: 1 })).toBe(true);
    expect(isValidSportsSessions({ strength: 3, spirit: 3, defense: 0, speed: 0 })).toBe(false);
  });
});
