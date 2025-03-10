"use client";

import { AnyFormatter, getFormatter } from "@/lib/dates";
import { useMemo } from "react";

/**
 * A custom tooltip component for charts
 */
export function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter: labelFormatterProp,
}: {
  /**
   * Whether the tooltip is currently being displayed
   */
  active?: boolean;
  /**
   * Array of data points at the current tooltip position. Each contains a value and dataKey
   */
  payload?: Array<{ value: number | [number, number]; dataKey: string }>;
  /**
   * The x-axis label (typically a date) at the tooltip position
   */
  label?: string;
  /**
   * Function to format numeric values into [formattedValue, unit] tuples
   */
  formatter?: AnyFormatter;

  /**
   * Function to format the x-axis label (e.g. format dates)
   */
  labelFormatter?: AnyFormatter;
}) {
  const valueFormatter = useMemo(
    () => (formatter ? getFormatter(formatter) : (x: number) => x.toString()),
    [formatter],
  );

  const labelFormatter = useMemo(
    () =>
      labelFormatterProp ? getFormatter(labelFormatterProp) : (x: string) => x,
    [labelFormatterProp],
  );

  if (!active || !payload || !payload[0]) return null;

  // Handle both single values and ranges
  const mainValue = payload.find((p) => p.dataKey === "value")?.value as number;
  const range = payload.find((p) => p.dataKey === "range")?.value as [
    number,
    number,
  ];

  const content = valueFormatter(mainValue as never);
  const lines = content.split("<br />");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">
        {labelFormatter((label as never) || "")}
      </p>
      {lines.map((line, i) => {
        // Extract the number between <b> tags if it exists
        const match = line.match(/<b>(.*?)<\/b>/);
        if (match) {
          const [fullMatch, number] = match;
          const [before, after] = line.split(fullMatch);
          return (
            <p
              key={i}
              className="whitespace-nowrap text-gray-700 dark:text-gray-300"
            >
              {before}
              <span className="font-bold">{number}</span>
              {after}
            </p>
          );
        }
        return (
          <p
            key={i}
            className="whitespace-nowrap text-gray-700 dark:text-gray-300"
          >
            {line}
          </p>
        );
      })}
      {range && (
        <p className="mt-1 text-sm text-gray-500">
          Range: {valueFormatter(range[0] as never)} -{" "}
          {valueFormatter(range[1] as never)}
        </p>
      )}
    </div>
  );
}
