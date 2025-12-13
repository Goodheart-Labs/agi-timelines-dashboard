"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { ChartDataPoint } from "../lib/types";
import { getFormatter } from "@/lib/dates";

const Y_MIN = 2024;
const Y_MAX_CAPPED = 2060;
const BASE_YEAR = 2024;

function timestampToYear(seconds: number): number {
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

type IndividualForecastChartProps = {
  data: ChartDataPoint[];
  color: string;
  label: string;
  /** If true, values are timestamps in seconds that need conversion to years */
  isTimestamp?: boolean;
  tooltip?: TooltipProps<number, string>["content"];
  sourceName: string;
  sourceUrl: string;
  filename: string;
};

export function IndividualForecastChart({
  data,
  color,
  label,
  isTimestamp = false,
  tooltip,
  sourceName,
  sourceUrl,
  filename,
}: IndividualForecastChartProps) {
  const [scale, setScale] = useState<"linear" | "log">("linear");
  const [capAt2060, setCapAt2060] = useState(true);

  // Calculate the actual max year from the data (for uncapped mode)
  const actualMaxYear = useMemo(() => {
    let max = Y_MIN;
    for (const point of data) {
      const value = isTimestamp ? timestampToYear(point.value) : point.value;
      if (value > max) max = value;
      if (point.range) {
        const upper = isTimestamp
          ? timestampToYear(point.range[1])
          : point.range[1];
        if (upper > max) max = upper;
      }
    }
    // Round up to nearest 10 for nicer axis
    return Math.ceil(max / 10) * 10;
  }, [data, isTimestamp]);

  const yMax = capAt2060 ? Y_MAX_CAPPED : actualMaxYear;

  // Process data: convert timestamps to years and optionally clamp to bounds
  const processedData = useMemo(() => {
    return data.map((point) => {
      const rawValue = isTimestamp ? timestampToYear(point.value) : point.value;
      const clampedValue = clampYear(rawValue, yMax);

      let clampedRange: [number, number] | undefined;
      if (point.range) {
        const rawLower = isTimestamp
          ? timestampToYear(point.range[0])
          : point.range[0];
        const rawUpper = isTimestamp
          ? timestampToYear(point.range[1])
          : point.range[1];
        clampedRange = [clampYear(rawLower, yMax), clampYear(rawUpper, yMax)];
      }

      return {
        date: point.date,
        value: clampedValue,
        range: clampedRange,
      };
    });
  }, [data, isTimestamp, yMax]);

  // Transform data for log scale if needed
  const chartData =
    scale === "log"
      ? processedData.map((point) => ({
          ...point,
          value: yearToLogValue(point.value),
          range: point.range
            ? ([
                yearToLogValue(point.range[0]),
                yearToLogValue(point.range[1]),
              ] as [number, number])
            : undefined,
        }))
      : processedData;

  // Check if all data points have range values
  const hasDistribution = chartData.every((point) => point.range !== undefined);

  const xAxisFormatter = getFormatter("MMM yyyy");

  const yDomain: [number, number] =
    scale === "log"
      ? [yearToLogValue(Y_MIN), yearToLogValue(yMax)]
      : [Y_MIN, yMax];

  const yTickFormatter = (value: number) => {
    if (scale === "log") {
      return String(logValueToYear(value));
    }
    return String(value);
  };

  const handleDownload = () => {
    const csvRows = [
      `# ${sourceName} Data`,
      "# For errors or questions, contact: nathan@goodhartlabs.com",
      "#",
      `# Downloaded: ${new Date().toISOString()}`,
      "#",
      "Date,Median,Lower (10th percentile),Upper (90th percentile)",
    ];

    for (const point of processedData) {
      const dateStr = new Date(point.date).toISOString().split("T")[0];
      const lower = point.range ? point.range[0] : "";
      const upper = point.range ? point.range[1] : "";
      csvRows.push(`${dateStr},${point.value},${lower},${upper}`);
    }

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="relative h-[320px] w-full">
        <div className="absolute left-0 top-0 text-sm text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 40,
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
              tickFormatter={xAxisFormatter}
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
              scale={scale}
              domain={yDomain}
              tickFormatter={yTickFormatter}
            />
            {tooltip ? <Tooltip content={tooltip} /> : null}
            {hasDistribution && (
              <Area
                type="monotone"
                dataKey="range"
                fill={color}
                fillOpacity={0.2}
                stroke="none"
                isAnimationActive={false}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer with source, download, and scale toggle */}
      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <div>
          <span>Source: </span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {sourceName}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="text-blue-500 hover:underline"
          >
            Download data
          </button>
          <div className="inline-flex rounded border border-gray-300 text-xs font-medium dark:border-gray-600">
            <button
              onClick={() => setCapAt2060(true)}
              className={`px-2 py-1 ${
                capAt2060
                  ? "bg-gray-200 dark:bg-gray-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              2060
            </button>
            <button
              onClick={() => setCapAt2060(false)}
              className={`px-2 py-1 ${
                !capAt2060
                  ? "bg-gray-200 dark:bg-gray-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
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
                  ? "bg-gray-200 dark:bg-gray-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Log
            </button>
            <button
              onClick={() => setScale("linear")}
              className={`px-2 py-1 ${
                scale === "linear"
                  ? "bg-gray-200 dark:bg-gray-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
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
