import { ChartDataPoint } from "./types";

/**
 * Smooths chart data using a simple moving average.
 * This reduces visual noise while preserving the overall trend.
 *
 * @param data - The original data points
 * @param windowSize - Number of points to average (default 7 for weekly smoothing)
 * @returns Smoothed data points
 */
export function smoothData(
  data: ChartDataPoint[],
  windowSize: number = 7
): ChartDataPoint[] {
  if (data.length === 0 || windowSize <= 1) {
    return data;
  }

  // Ensure window size doesn't exceed data length
  const effectiveWindow = Math.min(windowSize, data.length);

  return data.map((point, index) => {
    // Calculate the range of indices to average
    const halfWindow = Math.floor(effectiveWindow / 2);
    const start = Math.max(0, index - halfWindow);
    const end = Math.min(data.length - 1, index + halfWindow);

    // Calculate average value
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i++) {
      sum += data[i].value;
      count++;
    }
    const smoothedValue = sum / count;

    // If the data has ranges, smooth those too
    let smoothedRange: [number, number] | undefined;
    if (point.range !== undefined) {
      let minSum = 0;
      let maxSum = 0;
      for (let i = start; i <= end; i++) {
        if (data[i].range) {
          minSum += data[i].range![0];
          maxSum += data[i].range![1];
        }
      }
      smoothedRange = [minSum / count, maxSum / count];
    }

    return {
      ...point,
      value: smoothedValue,
      ...(smoothedRange ? { range: smoothedRange } : {}),
    };
  });
}
