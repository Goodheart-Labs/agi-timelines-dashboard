import type { MetaculusForecast } from "../types";

/** Exports can include the retired model even when only community data is requested. */
export function communityForecasts(rows: MetaculusForecast[]) {
  const community = rows
    .filter(
      (row) =>
        row["Question ID"] && row["Forecaster Username"] === "recency_weighted",
    )
    .sort(
      (a, b) =>
        new Date(a["Start Time"]).getTime() -
        new Date(b["Start Time"]).getTime(),
    );
  if (!community.length) {
    throw new Error("Metaculus community forecasts unavailable");
  }
  return community;
}
