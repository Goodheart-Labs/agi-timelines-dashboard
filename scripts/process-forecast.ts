// https://www.metaculus.com/questions/3479/date-weakly-general-ai-is-publicly-known/

import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { MetaculusResponse } from "@/lib/types";
import { getInverseTransform } from "@/lib/services/metaculus";
const DATA_DIR = path.join(process.cwd(), "data", "metaculus-3479");
const FORECAST_DATA_PATH = path.join(DATA_DIR, "forecast_data.csv");
const QUESTION_DATA_PATH = path.join(DATA_DIR, "question_data.json");
// Fetch question data
async function main() {
  // Read question data
  const questionData = JSON.parse(
    fs.readFileSync(QUESTION_DATA_PATH, "utf8"),
  ) as MetaculusResponse["question"];

  const inverseTransform = getInverseTransform(questionData.scaling);
  const forecastData = fs.readFileSync(FORECAST_DATA_PATH, "utf8");

  // use papaparse to parse the data
  const forecastDataParsed = Papa.parse(forecastData, {
    header: true,
  });

  // Take the last (most recent) sample
  const randomSample = forecastDataParsed.data[
    forecastDataParsed.data.length - 2
  ] as {
    "Continuous CDF": string;
  };

  // CDF Data Points
  const cdfDataPoints = JSON.parse(randomSample["Continuous CDF"]);

  // Get years of interest
  const startYear = getStartYear(questionData.scaling.range_min * 1000);
  const endYear = getEndYear(questionData.scaling.range_max * 1000);

  const results: { year: number; cdfValue: number; pdfValue: number }[] = [];

  // Loop through each year
  for (let year = startYear; year <= endYear; year++) {
    // Create a new date from year
    const date = new Date(year, 0, 1);
    // Get the transformed value
    const unitValue = inverseTransform(date.getTime() / 1000);

    // Get the rough index
    const roughIndex = unitValue / (1 / 200);
    const lowerIndex = Math.floor(roughIndex);
    const upperIndex = Math.ceil(roughIndex);

    // Get the values at the lower and upper indices
    const lowerValue = cdfDataPoints[lowerIndex];
    const upperValue = cdfDataPoints[upperIndex];

    // Interpolate between the two values
    const cdfValue =
      lowerValue + (upperValue - lowerValue) * (roughIndex - lowerIndex);

    results.push({
      year,
      cdfValue,
      pdfValue: cdfValue - (results[results.length - 1]?.cdfValue || 0),
    });
  }

  results.forEach((result) => {
    console.log(result.year, (result.pdfValue * 100).toFixed(4) + "%");
  });
}

main().catch(console.error);

/**
 * This function takes in a timestamp and returns the nearest year
 * on or after the timestamp.
 */
function getStartYear(timestamp: number) {
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
function getEndYear(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const endDate = new Date(year, 0, 1);
  if (date >= endDate) {
    return year;
  }
  return year - 1;
}
