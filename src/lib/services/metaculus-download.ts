import { ChartDataPoint, MetaculusForecast, MetaculusResponse } from "../types";
import { getInverseTransform, getTransform } from "./metaculus";

type YearForecast = { year: number; cdfValue: number; pdfValue: number };

export async function downloadMetaculusData(questionId: number) {
  const response = await fetch(
    `/api/metaculus-download?questionId=${questionId}`,
    {
      cache: "force-cache",
      next: {
        revalidate: 60 * 60 * 24, // 24 hours
      },
    },
  );
  const { question, forecast: forecastData } = (await response.json()) as {
    question: MetaculusResponse["question"];
    forecast: MetaculusForecast[];
  };

  const rangeStart = getStartYear(question.scaling.range_min * 1000);
  const rangeEnd = getEndYear(question.scaling.range_max * 1000);
  const inverseTransform = getInverseTransform(question.scaling);
  const transform = getTransform(question.scaling);

  const boundsResults: (Omit<ChartDataPoint, "date"> | null)[] = [];
  const forecastResults: YearForecast[][] = [];
  for (let i = 0; i < forecastData.length; i++) {
    const forecast = forecastData[i];
    const cdfDataPoints = JSON.parse(forecast["Continuous CDF"]) as number[];

    // Determine per-year probabilities
    const results: YearForecast[] = [];
    for (let year = rangeStart; year <= rangeEnd; year++) {
      const currentYear = new Date(year, 0, 1);
      const unitValue = inverseTransform(currentYear.getTime() / 1000);

      const roughIndex = unitValue / (1 / 200);
      const lowerIndex = Math.floor(roughIndex);
      const upperIndex = Math.ceil(roughIndex);

      const lowerValue = cdfDataPoints[lowerIndex];
      const upperValue = cdfDataPoints[upperIndex];

      const cdfValue =
        lowerValue + (upperValue - lowerValue) * (roughIndex - lowerIndex);

      results.push({
        year,
        cdfValue,
        pdfValue: cdfValue - (results[results.length - 1]?.cdfValue || 0),
      });
    }
    forecastResults.push(results);

    // Determine the bounds
    let lower = 0,
      median = 0,
      upper = 0;
    for (let i = 0; i < cdfDataPoints.length; i++) {
      const value = cdfDataPoints[i];
      if (value > 0.1 && !lower) {
        lower = transform(getInterpolatedIndex(cdfDataPoints, i, 0.1) / 200);
      }
      if (value > 0.5 && !median) {
        median = transform(getInterpolatedIndex(cdfDataPoints, i, 0.5) / 200);
      }
      if (value > 0.9 && !upper) {
        upper = transform(getInterpolatedIndex(cdfDataPoints, i, 0.9) / 200);
      }
    }

    if (lower && median && upper) {
      boundsResults.push({
        value: median,
        range: [lower, upper],
      });
    } else {
      boundsResults.push(null);
    }
  }

  // Read first forecast to get start date
  const start = new Date(forecastData[0]["Start Time"]);

  // parse close time
  const close = new Date(question.scheduled_close_time);
  // Choose the end time which is nearer (now or close)
  const end = new Date() < close ? new Date() : close;

  const byYear: {
    index: number;
    date: number;
    years: YearForecast[];
  }[] = [];

  const datapoints: ChartDataPoint[] = [];

  // Loop from the start to the end, one day at a time
  let forecastIndex = -1;
  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    // While the forecast end time is before the current date, increment the forecast index
    let nextIndex = forecastIndex + 1;
    while (
      forecastData?.[nextIndex] &&
      new Date(forecastData[nextIndex]["Start Time"]) <= date
    ) {
      forecastIndex = nextIndex;
      nextIndex = forecastIndex + 1;
    }
    if (forecastIndex === -1) {
      console.error("Forecast index is -1");
      throw new Error("Forecast index is -1");
    }

    const results = forecastResults[forecastIndex];

    // Add the results to the dataset
    byYear.push({ index: forecastIndex, date: date.getTime(), years: results });

    // Add the bounds to the datapoints
    const bounds = boundsResults[forecastIndex];
    if (bounds) {
      datapoints.push({
        date: date.toISOString(),
        value: bounds.value,
        range: bounds.range,
      });
    }
  }

  return { question, byYear, datapoints };
}

/**
 * This function takes in a timestamp and returns the nearest year
 * on or after the timestamp.
 */
export function getStartYear(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const startDate = new Date(year, 0, 1);
  if (date <= startDate) {
    return year;
  }
  return year + 1;
}

/**
 * This function takes in a timestamp and returns the nearest year
 * on or before the timestamp.
 */
export function getEndYear(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const endDate = new Date(year, 0, 1);
  if (date >= endDate) {
    return year;
  }
  return year - 1;
}

function getInterpolatedIndex(data: number[], index: number, target: number) {
  // We need to get an interpolated index that's closest to the target
  const lowerIndex = index - 1;
  const upperIndex = index;
  const lower = data[lowerIndex];
  const upper = data[upperIndex];
  const interpolatedIndex = lowerIndex + (target - lower) / (upper - lower);
  return interpolatedIndex;
}
