// https://www.metaculus.com/questions/3479/date-weakly-general-ai-is-publicly-known/

import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { MetaculusResponse } from "@/lib/types";
import { getInverseTransform, getTransform } from "@/lib/services/metaculus";
import { getEndYear } from "@/lib/services/metaculus-download";
import { getStartYear } from "@/lib/services/metaculus-download";
const DATA_DIR = path.join(process.cwd(), "data", "metaculus-3479");
const FORECAST_DATA_PATH = path.join(DATA_DIR, "forecast_data.csv");
const QUESTION_DATA_PATH = path.join(DATA_DIR, "question_data.json");
// Fetch question data
async function main() {
  // Read question data
  const questionData = JSON.parse(
    fs.readFileSync(QUESTION_DATA_PATH, "utf8"),
  ) as MetaculusResponse["question"];

  const transform = getTransform(questionData.scaling);
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

  let lower: number = 0;
  let median: number = 0;
  let upper: number = 0;
  for (let i = 0; i < cdfDataPoints.length; i++) {
    const value = cdfDataPoints[i];
    if (value > 0.1 && !lower) {
      lower = i;
      const index = getInterpolatedIndex(lower, 0.1);
      const value = new Date(transform(index / 200) * 1000);
      console.log(value);
    }
    if (value > 0.5 && !median) {
      median = i;
      const index = getInterpolatedIndex(median, 0.5);
      const value = new Date(transform(index / 200) * 1000);
      console.log(value);
    }
    if (value > 0.9 && !upper) {
      upper = i;
      const index = getInterpolatedIndex(upper, 0.9);
      const value = new Date(transform(index / 200) * 1000);
      console.log(value);
    }
  }

  function getInterpolatedIndex(index: number, target: number) {
    // We need to get an interpolated index that's closest to the target
    const lowerIndex = index - 1;
    const upperIndex = index;
    const lower = cdfDataPoints[lowerIndex];
    const upper = cdfDataPoints[upperIndex];
    const interpolatedIndex = lowerIndex + (target - lower) / (upper - lower);
    return interpolatedIndex;
  }
  // console.log(
  //   lower,
  //   cdfDataPoints[lower],
  //   median,
  //   cdfDataPoints[median],
  //   upper,
  //   cdfDataPoints[upper],
  // );

  // // Get years of interest
  // const startYear = getStartYear(questionData.scaling.range_min * 1000);
  // const endYear = getEndYear(questionData.scaling.range_max * 1000);

  // const results: { year: number; cdfValue: number; pdfValue: number }[] = [];

  // // Loop through each year
  // for (let year = startYear; year <= endYear; year++) {
  //   // Create a new date from year
  //   const date = new Date(year, 0, 1);
  //   // Get the transformed value
  //   const unitValue = inverseTransform(date.getTime() / 1000);

  //   // Get the rough index
  //   const roughIndex = unitValue / (1 / 200);
  //   const lowerIndex = Math.floor(roughIndex);
  //   const upperIndex = Math.ceil(roughIndex);

  //   // Get the values at the lower and upper indices
  //   const lowerValue = cdfDataPoints[lowerIndex];
  //   const upperValue = cdfDataPoints[upperIndex];

  //   // Interpolate between the two values
  //   const cdfValue =
  //     lowerValue + (upperValue - lowerValue) * (roughIndex - lowerIndex);

  //   results.push({
  //     year,
  //     cdfValue,
  //     pdfValue: cdfValue - (results[results.length - 1]?.cdfValue || 0),
  //   });
  // }

  // results.forEach((result) => {
  //   console.log(result.year, (result.pdfValue * 100).toFixed(4) + "%");
  // });
}

main().catch(console.error);
