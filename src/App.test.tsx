// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";
import { YOKAI } from "./engine/yokaiData";

describe("App", () => {
  it("keeps speciesId synchronized with the filtered Yo-kai list", async () => {
    const defaultSpeciesId = YOKAI.find((entry) => entry.name === "ジバニャン")?.id ?? YOKAI[0]?.id ?? "";
    const alternative = YOKAI.find(
      (candidate) =>
        candidate.id !== defaultSpeciesId &&
        YOKAI.filter((entry) =>
          entry.name.toLowerCase().includes(candidate.name.toLowerCase()),
        ).length === 1,
    );

    expect(alternative).toBeDefined();

    render(<App />);

    const speciesSelect = screen.getAllByLabelText("妖怪")[0] as HTMLSelectElement;
    const searchInput = screen.getByLabelText("妖怪検索");

    fireEvent.change(searchInput, { target: { value: alternative!.name } });

    await waitFor(() => {
      expect(speciesSelect.value).toBe(alternative!.id);
    });

    fireEvent.change(searchInput, { target: { value: "__no_matching_yokai__" } });

    await waitFor(() => {
      expect(speciesSelect.value).toBe("");
    });
  });


  it.each([
    ["0", "0"],
    ["100", "100"],
    ["小数", "1.5"],
  ])("does not calculate forward stats for invalid level: %s", async (_label, value) => {
    render(<App />);

    const forwardRegion = screen.getByRole("region", { name: "順計算" });
    const levelInput = within(forwardRegion).getByLabelText("レベル");

    fireEvent.change(levelInput, { target: { value } });

    await waitFor(() => {
      expect(
        within(forwardRegion).getByText("レベルは1〜99の整数で入力してください。"),
      ).toBeDefined();
      expect(forwardRegion.querySelector(".result-stats")).toBeNull();
    });
  });

  it("does not calculate forward stats when rank-up count exceeds five", async () => {
    render(<App />);

    const forwardRegion = screen.getByRole("region", { name: "順計算" });
    const rankInput = within(forwardRegion).getByLabelText("アゲランク回数");

    fireEvent.change(rankInput, { target: { value: "6" } });

    await waitFor(() => {
      expect(within(forwardRegion).getByText(/アゲランク回数は0〜5の整数/)).toBeDefined();
      expect(forwardRegion.querySelector(".result-stats")).toBeNull();
    });
  });

  it("does not calculate forward stats when Sports Club sessions exceed five", async () => {
    render(<App />);

    const forwardRegion = screen.getByRole("region", { name: "順計算" });
    const sportsHeading = within(forwardRegion).getByRole("heading", { name: /スポーツクラブ/ });
    const sportsSection = sportsHeading.closest("section");

    expect(sportsSection).not.toBeNull();

    fireEvent.change(within(sportsSection!).getByLabelText("ちから"), {
      target: { value: "3" },
    });
    fireEvent.change(within(sportsSection!).getByLabelText("ようりょく"), {
      target: { value: "3" },
    });

    await waitFor(() => {
      expect(
        within(forwardRegion).getByText("スポーツクラブは各項目0〜5の整数、4種合計5回までです。"),
      ).toBeDefined();
      expect(forwardRegion.querySelector(".result-stats")).toBeNull();
    });
  });
});
