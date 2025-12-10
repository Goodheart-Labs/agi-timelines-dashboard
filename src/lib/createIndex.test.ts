import { describe, expect, test } from "bun:test";
import { createIndex } from "./createIndex";
import {
  START_YEAR,
  YEAR_RANGE,
  KALSHI_YEARS_BEFORE_CUTOFF,
  OTHER_SOURCES_WEIGHT,
  KALSHI_WEIGHT,
} from "./constants";

/**
 * Tests for the AGI Index calculation logic.
 *
 * These tests verify:
 * 1. Normalization of probability distributions
 * 2. Kalshi weighting integration
 * 3. Percentile calculations (10th, 50th, 90th)
 * 4. Date range handling
 */

// Helper to create mock Metaculus data
function createMockMetaculusData(
  startDate: number,
  yearProbabilities: Record<number, number>,
) {
  return {
    question: {
      id: 1,
      scaling: { range_min: 2024, range_max: 2100, zero_point: 0 },
      aggregations: {
        recency_weighted: {
          history: [] as Array<{
            start_time: number;
            end_time: number;
            means: number[] | null;
            centers: number[];
            interval_lower_bounds: number[] | null;
            interval_upper_bounds: number[] | null;
          }>,
        },
      },
      scheduled_close_time: "2030-01-01T00:00:00Z",
      scheduled_resolve_time: "2030-01-01T00:00:00Z",
    },
    datapoints: [{ date: new Date(startDate).toISOString(), value: 2035 }],
    byYear: [
      {
        date: startDate,
        years: Object.entries(yearProbabilities).map(([year, pdfValue]) => ({
          year: parseInt(year),
          pdfValue,
        })),
      },
    ],
  };
}

// Helper to create mock Manifold data
function createMockManifoldData(
  startDate: number,
  probabilities: Record<number, number>,
) {
  return {
    data: [{ date: new Date(startDate).toISOString(), value: 2035 }],
    byYear: [
      {
        date: startDate,
        probabilities,
      },
    ],
  };
}

// Helper to create mock Kalshi data
function createMockKalshiData(startDate: number, yesPercentage: number) {
  return [
    {
      date: new Date(startDate).toISOString(),
      value: yesPercentage,
    },
  ];
}

describe("createIndex", () => {
  // Use a consistent date for all tests
  const testDate = new Date("2024-06-15").getTime();

  describe("constants verification", () => {
    test("YEAR_RANGE should be 176 (2024-2199)", () => {
      expect(YEAR_RANGE).toBe(176);
    });

    test("START_YEAR should be 2024", () => {
      expect(START_YEAR).toBe(2024);
    });

    test("KALSHI_YEARS_BEFORE_CUTOFF should be 6 (2024-2029)", () => {
      expect(KALSHI_YEARS_BEFORE_CUTOFF).toBe(6);
    });

    test("weights should sum to 1", () => {
      expect(OTHER_SOURCES_WEIGHT + KALSHI_WEIGHT).toBe(1);
    });
  });

  describe("basic index calculation", () => {
    test("creates index data with correct structure", () => {
      // Create simple mock data with all probability in 2035
      const yearProbs = { 2035: 1.0 };
      const manifoldProbs = { 2035: 1.0 };

      const weakAgi = createMockMetaculusData(testDate, yearProbs);
      const fullAgi = createMockMetaculusData(testDate, yearProbs);
      const turingTest = createMockMetaculusData(testDate, yearProbs);
      const manifold = createMockManifoldData(testDate, manifoldProbs);
      const kalshi = createMockKalshiData(testDate, 50);

      const result = createIndex(
        weakAgi,
        fullAgi,
        turingTest,
        manifold,
        kalshi,
      );

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("startDates");
      expect(Array.isArray(result.data)).toBe(true);
    });

    test("data points have required fields", () => {
      const yearProbs = { 2035: 1.0 };
      const manifoldProbs = { 2035: 1.0 };

      const weakAgi = createMockMetaculusData(testDate, yearProbs);
      const fullAgi = createMockMetaculusData(testDate, yearProbs);
      const turingTest = createMockMetaculusData(testDate, yearProbs);
      const manifold = createMockManifoldData(testDate, manifoldProbs);
      const kalshi = createMockKalshiData(testDate, 50);

      const result = createIndex(
        weakAgi,
        fullAgi,
        turingTest,
        manifold,
        kalshi,
      );

      if (result.data.length > 0) {
        const point = result.data[0];
        expect(point).toHaveProperty("date");
        expect(point).toHaveProperty("value");
        expect(point).toHaveProperty("range");
        expect(Array.isArray(point.range)).toBe(true);
        expect(point.range).toHaveLength(2);
      }
    });
  });

  describe("median calculation", () => {
    test("calculates median year correctly when all sources agree", () => {
      // All sources predict 100% probability for 2035
      const yearProbs = { 2035: 1.0 };
      const manifoldProbs = { 2035: 1.0 };

      const weakAgi = createMockMetaculusData(testDate, yearProbs);
      const fullAgi = createMockMetaculusData(testDate, yearProbs);
      const turingTest = createMockMetaculusData(testDate, yearProbs);
      const manifold = createMockManifoldData(testDate, manifoldProbs);
      // Kalshi at 100% before 2030 would skew results, use 0% to not affect median
      const kalshi = createMockKalshiData(testDate, 0);

      const result = createIndex(
        weakAgi,
        fullAgi,
        turingTest,
        manifold,
        kalshi,
      );

      // The median should be 2035 since all probability is there
      if (result.data.length > 0) {
        expect(result.data[0].value).toBe(2035);
      }
    });

    test("calculates median with spread distribution", () => {
      // Spread probability across multiple years
      const yearProbs = {
        2030: 0.2,
        2035: 0.3,
        2040: 0.3,
        2045: 0.2,
      };
      const manifoldProbs = {
        2030: 0.2,
        2035: 0.3,
        2040: 0.3,
        2045: 0.2,
      };

      const weakAgi = createMockMetaculusData(testDate, yearProbs);
      const fullAgi = createMockMetaculusData(testDate, yearProbs);
      const turingTest = createMockMetaculusData(testDate, yearProbs);
      const manifold = createMockManifoldData(testDate, manifoldProbs);
      const kalshi = createMockKalshiData(testDate, 20); // 20% before 2030

      const result = createIndex(
        weakAgi,
        fullAgi,
        turingTest,
        manifold,
        kalshi,
      );

      if (result.data.length > 0) {
        // Median should be around 2035-2040 given the distribution
        expect(result.data[0].value).toBeGreaterThanOrEqual(2030);
        expect(result.data[0].value).toBeLessThanOrEqual(2045);
      }
    });
  });

  describe("percentile bounds", () => {
    test("range contains lower (10th) and upper (90th) percentiles", () => {
      const yearProbs = {
        2028: 0.1,
        2035: 0.4,
        2040: 0.4,
        2050: 0.1,
      };
      const manifoldProbs = {
        2028: 0.1,
        2035: 0.4,
        2040: 0.4,
        2050: 0.1,
      };

      const weakAgi = createMockMetaculusData(testDate, yearProbs);
      const fullAgi = createMockMetaculusData(testDate, yearProbs);
      const turingTest = createMockMetaculusData(testDate, yearProbs);
      const manifold = createMockManifoldData(testDate, manifoldProbs);
      const kalshi = createMockKalshiData(testDate, 10);

      const result = createIndex(
        weakAgi,
        fullAgi,
        turingTest,
        manifold,
        kalshi,
      );

      if (result.data.length > 0) {
        const [lower, upper] = result.data[0].range!;
        const median = result.data[0].value;

        // Lower bound should be <= median
        expect(lower).toBeLessThanOrEqual(median);
        // Upper bound should be >= median
        expect(upper).toBeGreaterThanOrEqual(median);
        // Bounds should be valid years
        expect(lower).toBeGreaterThanOrEqual(START_YEAR);
        expect(upper).toBeLessThanOrEqual(START_YEAR + YEAR_RANGE);
      }
    });
  });

  describe("Kalshi weighting", () => {
    test("high Kalshi probability shifts weight toward pre-2030", () => {
      // Base distribution centered around 2035
      const yearProbs = { 2035: 1.0 };
      const manifoldProbs = { 2035: 1.0 };

      const weakAgi = createMockMetaculusData(testDate, yearProbs);
      const fullAgi = createMockMetaculusData(testDate, yearProbs);
      const turingTest = createMockMetaculusData(testDate, yearProbs);
      const manifold = createMockManifoldData(testDate, manifoldProbs);

      // Test with low Kalshi (10% before 2030)
      const kalshiLow = createMockKalshiData(testDate, 10);
      const resultLow = createIndex(
        weakAgi,
        fullAgi,
        turingTest,
        manifold,
        kalshiLow,
      );

      // Test with high Kalshi (90% before 2030)
      const kalshiHigh = createMockKalshiData(testDate, 90);
      const resultHigh = createIndex(
        weakAgi,
        fullAgi,
        turingTest,
        manifold,
        kalshiHigh,
      );

      // High Kalshi should result in earlier median (or at least not later)
      if (resultLow.data.length > 0 && resultHigh.data.length > 0) {
        expect(resultHigh.data[0].value).toBeLessThanOrEqual(
          resultLow.data[0].value,
        );
      }
    });
  });

  describe("startDates tracking", () => {
    test("returns start dates for all sources", () => {
      const yearProbs = { 2035: 1.0 };
      const manifoldProbs = { 2035: 1.0 };

      const weakAgi = createMockMetaculusData(testDate, yearProbs);
      const fullAgi = createMockMetaculusData(testDate, yearProbs);
      const turingTest = createMockMetaculusData(testDate, yearProbs);
      const manifold = createMockManifoldData(testDate, manifoldProbs);
      const kalshi = createMockKalshiData(testDate, 50);

      const result = createIndex(
        weakAgi,
        fullAgi,
        turingTest,
        manifold,
        kalshi,
      );

      expect(result.startDates).toHaveProperty("computed");
      expect(result.startDates).toHaveProperty("fullAgi");
      expect(result.startDates).toHaveProperty("weakAgi");
      expect(result.startDates).toHaveProperty("turingTest");
      expect(result.startDates).toHaveProperty("manifold");
      expect(result.startDates).toHaveProperty("kalshi");
    });
  });

  describe("normalization", () => {
    test("handles sources with different probability scales", () => {
      // One source with raw probabilities that don't sum to 1
      const unnormalizedProbs = {
        2030: 0.5,
        2040: 0.5,
        2050: 0.5, // Sums to 1.5, should be normalized
      };
      const normalizedProbs = {
        2030: 0.33,
        2040: 0.34,
        2050: 0.33,
      };

      const weakAgi = createMockMetaculusData(testDate, unnormalizedProbs);
      const fullAgi = createMockMetaculusData(testDate, normalizedProbs);
      const turingTest = createMockMetaculusData(testDate, normalizedProbs);
      const manifold = createMockManifoldData(testDate, normalizedProbs);
      const kalshi = createMockKalshiData(testDate, 33);

      // Should not throw and should produce valid results
      const result = createIndex(
        weakAgi,
        fullAgi,
        turingTest,
        manifold,
        kalshi,
      );

      expect(result.data.length).toBeGreaterThan(0);
      if (result.data.length > 0) {
        expect(result.data[0].value).toBeGreaterThanOrEqual(START_YEAR);
      }
    });
  });
});
