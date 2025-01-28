import { ChartDataPoint } from "./types";

export const WEAK_AGI_DATE_RANGE = {
  start: new Date("2020-03-26").getTime(),
  end: new Date("2200-01-03").getTime(),
};

export const FULL_AGI_DATE_RANGE = {
  start: new Date("2020-08-25").getTime(),
  end: new Date("2199-12-25").getTime(),
};

export function dateToPercentage(
  date: number,
  range: { start: number; end: number },
): number {
  return (date - range.start) / (range.end - range.start);
}

export function createAgiIndex(
  weakAgiData: ChartDataPoint[],
  fullAgiData: ChartDataPoint[],
): { index: ChartDataPoint[] } {
  if (weakAgiData.length === 0 || fullAgiData.length === 0)
    return { index: [] };

  const startDate =
    Math.max(
      new Date(weakAgiData[0].date).getTime(),
      new Date(fullAgiData[0].date).getTime(),
    ) / 1000;
  const endDate =
    Math.min(
      new Date(weakAgiData[weakAgiData.length - 1].date).getTime(),
      new Date(fullAgiData[fullAgiData.length - 1].date).getTime(),
    ) / 1000;

  console.log("Start Date:", startDate / 1000);
  console.log("End Date:", endDate / 1000);

  const index: ChartDataPoint[] = [];

  let currentDate = startDate;
  const weakIndex = 0;
  const fullIndex = 0;
  while (currentDate <= endDate) {
    console.log("Current Date:", currentDate);

    // Get most recent weak and full data points before the current date
    let nextWeakIndex = weakIndex;
    let nextFullIndex = fullIndex;
    while (
      new Date(weakAgiData[nextWeakIndex].date).getTime() <
      currentDate * 1000
    ) {
      nextWeakIndex++;
    }
    while (
      new Date(fullAgiData[nextFullIndex].date).getTime() <
      currentDate * 1000
    ) {
      nextFullIndex++;
    }

    const weakPoint = weakAgiData[nextWeakIndex];
    const fullPoint = fullAgiData[nextFullIndex];

    const medianValue = (weakPoint.value + fullPoint.value) / 2;
    const lowerBound = Math.min(weakPoint.range![0], fullPoint.range![0]);
    const upperBound = Math.max(weakPoint.range![1], fullPoint.range![1]);

    index.push({
      date: new Date(currentDate * 1000).toISOString(),
      value: medianValue,
      range: [lowerBound, upperBound],
    });

    // Increment date by 1 day
    currentDate += 24 * 60 * 60;
  }

  return { index };
}
