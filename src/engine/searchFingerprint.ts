import type { SearchInput } from "./types";

export type ReverseSearchFingerprintInput = Pick<
  SearchInput,
  "speciesId" | "level" | "rankUps" | "observed" | "sessions" | "equipment" | "scoreProfile"
>;

export function reverseSearchFingerprint(input: ReverseSearchFingerprintInput): string {
  return JSON.stringify({
    speciesId: input.speciesId,
    level: input.level,
    rankUps: input.rankUps,
    observed: input.observed,
    sessions: input.sessions,
    equipment: input.equipment,
    scoreProfile: input.scoreProfile,
  });
}
