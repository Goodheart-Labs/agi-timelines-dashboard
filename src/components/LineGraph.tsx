"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineProps,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  XAxisProps,
  YAxis,
  YAxisProps,
} from "recharts";
import { ChartDataPoint } from "../lib/types";
import { AnyFormatter, getFormatter } from "@/lib/dates";

export function LineGraph({
  data,
  color,
  label,
  xAxisProps = {},
  xAxisFormatter,
  yAxisProps = {},
  yAxisFormatter,
  tooltip,
  lineProps = {},
  children,
}: {
  data: ChartDataPoint[];
  color: string;
  label: string;
  xAxisProps?: Partial<XAxisProps>;
  xAxisFormatter?: AnyFormatter;
  yAxisProps?: Partial<YAxisProps>;
  yAxisFormatter?: AnyFormatter;
  tooltip?: TooltipProps<number, string>["content"];
  lineProps?: Omit<LineProps, "ref">;
  children?: React.ReactNode;
}) {
  // Check if all data points have range values when distribution is requested
  const hasDistribution = data.every((point) => point.range !== undefined);

  return (
    <div className="relative h-[320px] w-full">
      <div className="absolute left-0 top-0 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
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
            {...xAxisProps}
            {...(xAxisFormatter
              ? { tickFormatter: getFormatter(xAxisFormatter) }
              : {})}
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
            {...yAxisProps}
            {...(yAxisFormatter
              ? { tickFormatter: getFormatter(yAxisFormatter) }
              : {})}
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
            {...lineProps}
          />
          {children}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
