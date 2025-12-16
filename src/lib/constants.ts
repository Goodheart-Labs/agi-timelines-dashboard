/**
 * Constants used throughout the AGI Timelines Dashboard
 */

// Time constants
export const MS_PER_DAY = 86400000;

// Year range for probability distributions
export const START_YEAR = 2024;
export const END_YEAR = 2199;
export const YEAR_RANGE = END_YEAR - START_YEAR + 1; // 176 years

// Index calculation constants
export const INDEX_CUTOFF_DATE = "2020-02-02";
export const KALSHI_CUTOFF_YEAR = 2030;
export const KALSHI_YEARS_BEFORE_CUTOFF = KALSHI_CUTOFF_YEAR - START_YEAR; // 6 years (2024-2029)

// Kalshi weighting in the final index calculation
// The other 4 sources are averaged, then Kalshi is factored in as 1/5 of total
export const OTHER_SOURCES_WEIGHT = 0.8;
export const KALSHI_WEIGHT = 0.2;

// UI constants
export const INDEX_BAR_HEIGHT = 17;

// Graph colors by source
export const GRAPH_COLORS = {
  weakAgi: "#dc2626", // red-600
  fullAgi: "#2563eb", // blue-600
  turingTest: "#16a34a", // green-600
  manifold: "#9333ea", // purple-600
  kalshi: "#ea580c", // orange-600
  kalshiOpenAI: "#0891b2", // cyan-600
  polymarketOpenAI: "#db2777", // pink-600
  index: "#64748b", // slate-500
} as const;

// Source display names
export const SOURCE_NAMES = {
  weakAgi: "Metaculus (Weak AGI)",
  fullAgi: "Metaculus (Full AGI)",
  turingTest: "Metaculus (Turing)",
  manifold: "Manifold",
  kalshi: "Kalshi",
} as const;
