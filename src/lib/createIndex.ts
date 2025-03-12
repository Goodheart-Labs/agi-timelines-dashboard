/**
 * Creates a normalized probability index for AGI arrival predictions across multiple data sources.
 *
 * Key constraints and decisions:
 * - Time range: 2024-2199 (176 years)
 *   - 2024: Lower bound from Manifold data
 *   - 2199: Upper bound from full AGI predictions (2200 for weak AGI)
 *
 * Data sources:
 * - Manifold: 2024-2049 (with 2049+ covered by final bet)
 * - Full AGI: Through 2199
 * - Weak AGI: Through 2200
 *
 * Approach:
 * - Normalize each dataset within overlapping years for fair comparison
 * - Convert to array of 176 elements (one per year)
 * - Handle null values for missing data points
 */

import { downloadMetaculusData } from "./services/metaculus-download";
import { getManifoldHistoricalData } from "./services/manifold-historical";
import { ChartDataPoint } from "./types";
import { fetchKalshiData } from "./services/kalshi";
import { getNearestKalshiIndex } from "./kalshi/index-helpers";

interface HasDate {
  date: number;
}

interface ProcessedData extends HasDate {
  years: number[];
}

/**
 * This function creates a year-by-year index of the probability of AGI arrival over time
 */
export function createIndex(
  weakAgiData: Awaited<ReturnType<typeof downloadMetaculusData>>,
  fullAgiData: Awaited<ReturnType<typeof downloadMetaculusData>>,
  turingTestData: Awaited<ReturnType<typeof downloadMetaculusData>>,
  manifoldData: Awaited<ReturnType<typeof getManifoldHistoricalData>>,
  kalshiData: Awaited<ReturnType<typeof fetchKalshiData>>,
) {
  const fullAgiPre = fullAgiData.byYear;
  const weakAgiPre = weakAgiData.byYear;
  const turingTestPre = turingTestData.byYear;
  const manifoldPre = manifoldData.byYear;

  const fullAgi: ProcessedData[] = fullAgiData.byYear.map((item) => {
    const years = Array.from({ length: 176 }, (_, i) => {
      const year = 2024 + i;
      const found = item.years.find((x) => x.year === year);
      if (!found) return 0;
      return found.pdfValue;
    });

    // Normalize the years so that they sum to 1
    const sum = years.reduce((acc, curr) => acc + curr, 0);
    const normalized = years.map((x) => x / sum);

    return {
      date: item.date,
      years: normalized,
    };
  });

  const weakAgi: ProcessedData[] = weakAgiData.byYear.map((item) => {
    const years = Array.from({ length: 176 }, (_, i) => {
      const year = 2024 + i;
      const found = item.years.find((x) => x.year === year);
      if (!found) return 0;
      return found.pdfValue;
    });

    // Normalize the years so that they sum to 1
    const sum = years.reduce((acc, curr) => acc + curr, 0);
    const normalized = years.map((x) => x / sum);

    return {
      date: item.date,
      years: normalized,
    };
  });

  const turingTest: ProcessedData[] = turingTestData.byYear.map((item) => {
    const years = Array.from({ length: 176 }, (_, i) => {
      const year = 2024 + i;
      const found = item.years.find((x) => x.year === year);
      if (!found) return 0;
      return found.pdfValue;
    });

    // Normalize the years so that they sum to 1
    const sum = years.reduce((acc, curr) => acc + curr, 0);
    const normalized = years.map((x) => x / sum);

    return {
      date: item.date,
      years: normalized,
    };
  });

  const manifold: ProcessedData[] = manifoldData.byYear.map((item) => {
    // Find last year present in the probabilities
    const lastYear = Math.max(...Object.keys(item.probabilities).map(Number));

    // Find number of years from last year to 2199, inclusive
    const numYears = 2199 - lastYear + 1;

    // Spread the probability of the final year over all final years
    const spread = item.probabilities[lastYear]! / numYears;

    const years = Array.from({ length: 176 }, (_, i) => {
      const year = 2024 + i;
      if (year < lastYear) {
        const found = item.probabilities[year];
        if (!found) return 0;
        return found;
      }

      return spread;
    });

    // Normalize the years so that they sum to 1
    const sum = years.reduce((acc, curr) => acc + curr, 0);
    const normalized = years.map((x) => x / sum);

    return {
      date: item.date,
      years: normalized,
    };
  });

  // In all cases we have a property called "date" which has a unix timestamp
  // Let's pick the earliest
  const startDate = Math.min(
    fullAgiPre[0].date,
    weakAgiPre[0].date,
    turingTestPre[0].date,
    manifoldPre[0].date,
  );

  // Now let's pick the latest
  const endDate = Math.max(
    fullAgiPre[fullAgiPre.length - 1].date,
    weakAgiPre[weakAgiPre.length - 1].date,
    turingTestPre[turingTestPre.length - 1].date,
    manifoldPre[manifoldPre.length - 1].date,
  );

  const data: ChartDataPoint[] = [];

  // We'll iterate over each day in the range
  for (let date = startDate; date <= endDate; date += 86400000) {
    // Get the nearest data point for each of the three sources

    const samples = [
      getNearest(fullAgi, date),
      getNearest(weakAgi, date),
      getNearest(turingTest, date),
      getNearest(manifold, date),
    ].filter((x) => x !== null);

    // For the samples that exist, find the average for each year
    let averages = Array.from({ length: 176 }, (_, i) => {
      const sum = samples.reduce((acc, curr) => acc + curr.years[i], 0);
      return sum / samples.length;
    });

    // Manipulate averages using kalshi data here:
    // ...

    // Check for kalshi data for this date
    const kalshiIndex = getNearestKalshiIndex(date, kalshiData);
    if (kalshiIndex) {
      const kalshiValue = kalshiData[kalshiIndex];
      const probabilityBefore2030 = averages
        .slice(0, 6)
        .reduce((acc, curr) => acc + curr, 0);
      const probabilityAfter2030 = averages
        .slice(6)
        .reduce((acc, curr) => acc + curr, 0);

      const kalshiProbability = kalshiValue.value / 100;
      const scalingFactorBefore = kalshiProbability / probabilityBefore2030;
      const scalingFactorAfter = (1 - kalshiProbability) / probabilityAfter2030;

      const kalshiAverages = averages.map((prob, i) => {
        const scalar = i < 6 ? scalingFactorBefore : scalingFactorAfter;
        return prob * scalar;
      });

      // Factor in kalshi averages as 1/5 of the total
      averages = averages.map((prob, i) => {
        return prob * 0.8 + kalshiAverages[i] * 0.2;
      });
    }

    // We're going to track lower, median, and upper bounds
    // at 10%, 50%, and 90%
    let lower = 0;
    let median = 0;
    let upper = 0;

    let sum = 0;
    for (let i = 0; i < 176; i++) {
      const value = averages[i];
      sum += value;
      if (sum >= 0.1 && !lower) lower = i + 2024;
      if (sum >= 0.5 && !median) median = i + 2024;
      if (sum >= 0.9 && !upper) upper = i + 2024;
    }

    data.push({
      value: median,
      range: [lower, upper],
      date: new Date(date).toISOString(),
    });
  }

  // Slice the data to only begin after February 2nd, 2020
  const errorDate = new Date("2020-02-02");
  const startIndex = data.findIndex((x) => new Date(x.date) >= errorDate);

  if (startIndex === -1) {
    return data;
  }

  return data.slice(startIndex);
}

/**
 * Given a date, this function will return the element in
 * the array that occurs on the same day, or null if none exists.
 */
function getNearest<T extends HasDate>(data: T[], date: number): T | null {
  // Convert timestamps to start of day for comparison
  const targetDay = Math.floor(date / 86400000) * 86400000;

  const match = data.find((item) => {
    const itemDay = Math.floor(item.date / 86400000) * 86400000;
    return itemDay === targetDay;
  });

  return match ?? null;
}
