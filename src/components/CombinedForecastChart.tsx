"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartDataPoint } from "../lib/types";
import { getFormatter } from "@/lib/dates";
import { format } from "date-fns";
import { GRAPH_COLORS, INDEX_CUTOFF_DATE } from "@/lib/constants";

type ForecastSource = {
  name: string;
  data: ChartDataPoint[];
  color: string;
  /** If true, values are timestamps in seconds that need conversion to years */
  isTimestamp?: boolean;
};

type CombinedDataPoint = {
  date: string;
  combinedRange?: [number, number];
  [key: string]: number | string | [number, number] | undefined;
};

type IndexDataPoint = {
  date: string;
  range?: [number, number]; // [10th percentile, 90th percentile]
};

const Y_MIN = 2024;
const Y_MAX_CAPPED = 2060;
const BASE_YEAR = 2024;

function timestampToYear(seconds: number): number {
  // Metaculus stores timestamps in seconds, JS Date expects milliseconds
  return new Date(seconds * 1000).getFullYear();
}

function clampYear(year: number, yMax: number): number {
  return Math.min(Math.max(year, Y_MIN), yMax);
}

// Transform year to "years from base" for log scale (add 1 to avoid log(0))
function yearToLogValue(year: number): number {
  return year - BASE_YEAR + 1;
}

// Transform log value back to year for display
function logValueToYear(logValue: number): number {
  return Math.round(logValue + BASE_YEAR - 1);
}

// Create a safe key from source name (remove special chars)
function toSafeKey(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

export function CombinedForecastChart({
  sources,
  indexData,
}: {
  sources: ForecastSource[];
  indexData?: IndexDataPoint[];
}) {
  const [scale, setScale] = useState<"linear" | "log">("linear");
  const [capAt2060, setCapAt2060] = useState(true);

  // Calculate the actual max year from all sources (for uncapped mode)
  const actualMaxYear = useMemo(() => {
    let max = Y_MIN;
    for (const source of sources) {
      for (const point of source.data) {
        const value = source.isTimestamp
          ? timestampToYear(point.value)
          : point.value;
        if (value > max) max = value;
      }
    }
    if (indexData) {
      for (const point of indexData) {
        if (point.range && point.range[1] > max) {
          max = point.range[1];
        }
      }
    }
    // Round up to nearest 10 for nicer axis
    return Math.ceil(max / 10) * 10;
  }, [sources, indexData]);

  const yMax = capAt2060 ? Y_MAX_CAPPED : actualMaxYear;

  // Combine all data points into a single dataset, keyed by date
  const dateMap = new Map<string, CombinedDataPoint>();

  for (const source of sources) {
    const safeKey = toSafeKey(source.name);

    for (const point of source.data) {
      // Normalize date to just YYYY-MM-DD for combining
      const dateKey = point.date.split("T")[0];

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: point.date });
      }

      const existing = dateMap.get(dateKey)!;

      // Convert timestamp to year if needed, then clamp to bounds
      const rawValue = source.isTimestamp
        ? timestampToYear(point.value)
        : point.value;
      existing[safeKey] = clampYear(rawValue, yMax);
    }
  }

  // Convert to array, filter by cutoff date, and sort by date
  const cutoffTime = new Date(INDEX_CUTOFF_DATE).getTime();

  // Create a map of index data by date for quick lookup
  const indexMap = new Map<string, [number, number]>();
  if (indexData) {
    for (const point of indexData) {
      if (point.range) {
        const dateKey = point.date.split("T")[0];
        // Clamp the range values to Y_MIN and yMax
        indexMap.set(dateKey, [
          clampYear(point.range[0], yMax),
          clampYear(point.range[1], yMax),
        ]);
      }
    }
  }

  const safeKeys = sources.map((s) => toSafeKey(s.name));

  const combinedData = Array.from(dateMap.values())
    .filter((point) => new Date(point.date).getTime() >= cutoffTime)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((point) => {
      // Use index data for combined confidence interval (10th-90th percentile)
      const dateKey = point.date.split("T")[0];
      const indexRange = indexMap.get(dateKey);
      if (indexRange) {
        point.combinedRange = indexRange;
      }

      // Transform values for log scale
      if (scale === "log") {
        for (const key of safeKeys) {
          const val = point[key];
          if (typeof val === "number") {
            point[key] = yearToLogValue(val);
          }
        }
        if (point.combinedRange) {
          point.combinedRange = [
            yearToLogValue(point.combinedRange[0]),
            yearToLogValue(point.combinedRange[1]),
          ];
        }
      }

      return point;
    });

  return (
    <div className="relative w-full">
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={combinedData}
            margin={{
              top: 10,
              right: 16,
              left: 16,
              bottom: 40,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis
              dataKey="date"
              tick={{
                fontSize: 12,
                // @ts-expect-error recharts types are wrong
                angle: -45,
                textAnchor: "end",
                dy: 5,
                fill: "currentColor",
                opacity: 0.65,
              }}
              stroke="currentColor"
              opacity={0.2}
              tickFormatter={getFormatter("MMM yyyy")}
            />
            <YAxis
              width={45}
              scale={scale}
              tick={{
                fontSize: 12,
                fill: "currentColor",
                opacity: 0.65,
              }}
              stroke="currentColor"
              opacity={0.2}
              domain={
                scale === "log"
                  ? [yearToLogValue(Y_MIN), yearToLogValue(yMax)]
                  : [Y_MIN, yMax]
              }
              tickFormatter={(value) =>
                scale === "log"
                  ? String(logValueToYear(value))
                  : String(Math.round(value))
              }
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;

                // Filter out the combinedRange from the main entries
                const lineEntries = payload.filter(
                  (entry) => entry.dataKey !== "combinedRange",
                );

                // Find the combined range entry
                const rangeEntry = payload.find(
                  (entry) => entry.dataKey === "combinedRange",
                );
                const range = rangeEntry?.value as [number, number] | undefined;

                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(label), "MMM d, yyyy")}
                    </p>
                    <div className="space-y-1">
                      {lineEntries.map((entry) => (
                        <div
                          key={entry.dataKey}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {entry.name}:
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {scale === "log" && typeof entry.value === "number"
                              ? logValueToYear(entry.value)
                              : entry.value}
                          </span>
                        </div>
                      ))}
                      {range && (
                        <div className="flex items-center gap-2 border-t border-gray-200 pt-1 dark:border-gray-600">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: GRAPH_COLORS.index }}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Combined range:
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {scale === "log"
                              ? `${logValueToYear(range[0])}-${logValueToYear(range[1])}`
                              : `${range[0]}-${range[1]}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              height={50}
              wrapperStyle={{ paddingBottom: 10, lineHeight: "1.5" }}
              formatter={(value) => (
                <span className="text-[10px] text-gray-600 sm:text-xs dark:text-gray-300">
                  {value}
                </span>
              )}
              iconSize={10}
              payload={[
                ...sources.map((source) => ({
                  value: source.name,
                  type: "line" as const,
                  color: source.color,
                })),
                {
                  value: "Combined Confidence Interval",
                  type: "square",
                  color: GRAPH_COLORS.index,
                },
              ]}
            />
            {/* Combined confidence interval area (behind lines) */}
            <Area
              type="monotone"
              dataKey="combinedRange"
              name="Combined Confidence Interval"
              fill={GRAPH_COLORS.index}
              fillOpacity={0.2}
              stroke="none"
              connectNulls
              isAnimationActive={false}
            />
            {/* Render source lines */}
            {sources.map((source) => {
              const safeKey = toSafeKey(source.name);
              return (
                <Line
                  key={safeKey}
                  type="monotone"
                  dataKey={safeKey}
                  name={source.name}
                  stroke={source.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with controls and data source */}
      <div className="mt-2 flex flex-col gap-2 border-t border-gray-200 pt-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:text-gray-400">
        <div>
          <span>Data sources: </span>
          <a
            href="https://www.metaculus.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Metaculus
          </a>
          {", "}
          <a
            href="https://manifold.markets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Manifold
          </a>
          {", "}
          <a
            href="https://kalshi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Kalshi
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              const csvRows = [
                "# AGI Timeline Forecasts Data",
                "# For errors or questions, contact: nathan@goodhartlabs.com",
                "#",
                `# Downloaded: ${new Date().toISOString()}`,
                "#",
                [
                  "Date",
                  ...sources.map((s) => s.name),
                  "Confidence Interval Lower",
                  "Confidence Interval Upper",
                ].join(","),
              ];

              for (const point of combinedData) {
                const values = sources.map((s) => {
                  const key = toSafeKey(s.name);
                  const val = point[key];
                  if (typeof val !== "number") return "";
                  return scale === "log" ? logValueToYear(val) : val;
                });
                const range = point.combinedRange as
                  | [number, number]
                  | undefined;
                const lower = range
                  ? scale === "log"
                    ? logValueToYear(range[0])
                    : range[0]
                  : "";
                const upper = range
                  ? scale === "log"
                    ? logValueToYear(range[1])
                    : range[1]
                  : "";
                csvRows.push(
                  [point.date.split("T")[0], ...values, lower, upper].join(","),
                );
              }

              const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "agi-timeline-forecasts.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-blue-500 hover:underline"
          >
            Download data
          </button>

          <div className="inline-flex rounded border border-gray-300 text-xs font-medium dark:border-gray-600">
            <button
              onClick={() => setCapAt2060(true)}
              className={`px-2 py-1 ${
                capAt2060
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              2060
            </button>
            <button
              onClick={() => setCapAt2060(false)}
              className={`px-2 py-1 ${
                !capAt2060
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Full
            </button>
          </div>
          <div className="inline-flex rounded border border-gray-300 text-xs font-medium dark:border-gray-600">
            <button
              onClick={() => setScale("log")}
              className={`px-2 py-1 ${
                scale === "log"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Log
            </button>
            <button
              onClick={() => setScale("linear")}
              className={`px-2 py-1 ${
                scale === "linear"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Linear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
