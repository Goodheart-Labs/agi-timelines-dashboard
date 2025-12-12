"use client";

import { ChartDataPoint } from "@/lib/types";

type GraphFooterProps = {
  sourceName: string;
  sourceUrl: string;
  data: ChartDataPoint[];
  filename: string;
  /** If true, values are timestamps in seconds that need conversion to years */
  isTimestamp?: boolean;
};

function timestampToYear(seconds: number): number {
  return new Date(seconds * 1000).getFullYear();
}

export function GraphFooter({
  sourceName,
  sourceUrl,
  data,
  filename,
  isTimestamp = false,
}: GraphFooterProps) {
  const handleDownload = () => {
    const csvRows = [
      `# ${sourceName} Data`,
      "# For errors or questions, contact: nathan@goodhartlabs.com",
      "#",
      `# Downloaded: ${new Date().toISOString()}`,
      "#",
      "Date,Median,Lower (10th percentile),Upper (90th percentile)",
    ];

    for (const point of data) {
      const date = point.date.split("T")[0];
      const median = isTimestamp ? timestampToYear(point.value) : point.value;
      const lower = point.range
        ? isTimestamp
          ? timestampToYear(point.range[0])
          : point.range[0]
        : "";
      const upper = point.range
        ? isTimestamp
          ? timestampToYear(point.range[1])
          : point.range[1]
        : "";
      csvRows.push([date, median, lower, upper].join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
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
      <button
        onClick={handleDownload}
        className="text-blue-500 hover:underline"
      >
        Download data
      </button>
    </div>
  );
}
