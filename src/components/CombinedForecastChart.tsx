"use client";

import {
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
  /** If true, values are ms timestamps that need conversion to years */
  isTimestamp?: boolean;
};

type CombinedDataPoint = {
  date: string;
  [key: string]: number | string | undefined;
};

function timestampToYear(seconds: number): number {
  // Metaculus stores timestamps in seconds, JS Date expects milliseconds
  return new Date(seconds * 1000).getFullYear();
}

export function CombinedForecastChart({
  sources,
}: {
  sources: ForecastSource[];
}) {
  // Combine all data points into a single dataset, keyed by date
  const dateMap = new Map<string, CombinedDataPoint>();

  for (const source of sources) {
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
      existing[source.name] = value;
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
            tickFormatter={(value) => String(value)}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;

              return (
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(label), "MMM d, yyyy")}
                  </p>
                  <div className="space-y-1">
                    {payload.map((entry) => (
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
                        </span>
                      </div>
                    ))}
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
          {sources.map((source) => (
            <Line
              key={source.name}
              type="monotone"
              dataKey={source.name}
              name={source.name}
              stroke={source.color}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
