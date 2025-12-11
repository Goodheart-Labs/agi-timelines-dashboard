"use client";

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
import { INDEX_CUTOFF_DATE } from "@/lib/constants";

type ForecastSource = {
  name: string;
  data: ChartDataPoint[];
  color: string;
  /** If true, values are timestamps in seconds that need conversion to years */
  isTimestamp?: boolean;
};

type CombinedDataPoint = {
  date: string;
  [key: string]: number | string | [number, number] | undefined;
};

function timestampToYear(seconds: number): number {
  // Metaculus stores timestamps in seconds, JS Date expects milliseconds
  return new Date(seconds * 1000).getFullYear();
}

// Create a safe key from source name (remove special chars)
function toSafeKey(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

export function CombinedForecastChart({
  sources,
}: {
  sources: ForecastSource[];
}) {
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

      // Convert timestamp to year if needed
      const value = source.isTimestamp
        ? timestampToYear(point.value)
        : point.value;
      existing[safeKey] = value;

      // Also store the range for confidence intervals
      if (point.range) {
        const rangeKey = `${safeKey}_range`;
        const [min, max] = point.range;
        const convertedRange: [number, number] = source.isTimestamp
          ? [timestampToYear(min), timestampToYear(max)]
          : [min, max];
        existing[rangeKey] = convertedRange;
      }
    }
  }

  // Convert to array, filter by cutoff date, and sort by date
  const cutoffTime = new Date(INDEX_CUTOFF_DATE).getTime();
  const combinedData = Array.from(dateMap.values())
    .filter((point) => new Date(point.date).getTime() >= cutoffTime)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="relative h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={combinedData}
          margin={{
            top: 20,
            right: 16,
            left: 16,
            bottom: 80,
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
            tick={{
              fontSize: 12,
              fill: "currentColor",
              opacity: 0.65,
            }}
            stroke="currentColor"
            opacity={0.2}
            domain={[2024, 2060]}
            allowDataOverflow={true}
            tickFormatter={(value) => String(value)}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;

              // Filter out the range entries from tooltip
              const lineEntries = payload.filter(
                (entry) => !String(entry.dataKey).endsWith("_range")
              );

              return (
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(label), "MMM d, yyyy")}
                  </p>
                  <div className="space-y-1">
                    {lineEntries.map((entry) => {
                      // Find the corresponding range using the safe key
                      const rangeEntry = payload.find(
                        (p) => p.dataKey === `${String(entry.dataKey)}_range`
                      );
                      const range = rangeEntry?.value as
                        | [number, number]
                        | undefined;

                      return (
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
                            {entry.value}
                            {range && (
                              <span className="ml-1 text-xs text-gray-500">
                                ({range[0]}-{range[1]})
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingTop: 40 }}
          />
          {/* Render areas first (behind lines) */}
          {sources.map((source) => {
            const safeKey = toSafeKey(source.name);
            return (
              <Area
                key={`${safeKey}_area`}
                type="monotone"
                dataKey={`${safeKey}_range`}
                fill={source.color}
                fillOpacity={0.15}
                stroke="none"
                connectNulls
                isAnimationActive={false}
                legendType="none"
              />
            );
          })}
          {/* Render lines on top */}
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
