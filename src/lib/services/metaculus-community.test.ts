import { describe, expect, test } from "bun:test";
import type { MetaculusForecast } from "../types";
import { communityForecasts } from "./metaculus-community";

function row(username: string, start: string): MetaculusForecast {
  return {
    "Question ID": "5121",
    "Forecaster ID": "",
    "Forecaster Username": username,
    "Start Time": start,
    "End Time": "",
    "Forecaster Count": "100",
    "Probability Yes": "",
    "Probability Yes Per Category": "",
    "Continuous CDF": "[0,0.5,1]",
  };
}

describe("communityForecasts", () => {
  test("removes interleaved model and individual forecasts and sorts community history", () => {
    const early = row("recency_weighted", "2023-03-26T00:00:00Z");
    const late = row("recency_weighted", "2023-04-01T00:00:00Z");
    const rows = [
      late,
      row("metaculus_prediction", "2023-03-30T00:00:00Z"),
      early,
      row("individual", "2023-04-02T00:00:00Z"),
    ];
    expect(communityForecasts(rows)).toEqual([early, late]);
    expect(rows[0]).toBe(late);
  });

  test("does not fall back to the retired model when community data is missing", () => {
    expect(() => communityForecasts([])).toThrow(
      "community forecasts unavailable",
    );
    expect(() =>
      communityForecasts([row("metaculus_prediction", "2024-10-01T00:00:00Z")]),
    ).toThrow("community forecasts unavailable");
  });
});
