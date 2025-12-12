"use client";

import { useState } from "react";
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
const Y_MAX = 2060;
const BASE_YEAR = 2024;

function timestampToYear(seconds: number): number {
  // Metaculus stores timestamps in seconds, JS Date expects milliseconds
  return new Date(seconds * 1000).getFullYear();
}

function clampYear(year: number): number {
  return Math.min(Math.max(year, Y_MIN), Y_MAX);
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
      existing[safeKey] = clampYear(rawValue);
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
        // Clamp the range values to Y_MIN and Y_MAX
        indexMap.set(dateKey, [
          clampYear(point.range[0]),
          clampYear(point.range[1]),
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
    <div className="relative h-[400px] w-full">
      <div className="absolute right-4 top-0 z-10">
        <button
          onClick={() => setScale(scale === "linear" ? "log" : "linear")}
          className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          {scale === "linear" ? "Log" : "Linear"}
        </button>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={combinedData}
          margin={{
            top: 20,
            right: 16,
            left: 16,
            bottom: 60,
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
                ? [yearToLogValue(Y_MIN), yearToLogValue(Y_MAX)]
                : [Y_MIN, Y_MAX]
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
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingTop: 20 }}
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
  );
}
