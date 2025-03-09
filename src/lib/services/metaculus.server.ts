import { ChartDataPoint, MetaculusResponse } from "../types";
const METACULUS_API = "https://www.metaculus.com/api";

export async function fetchMetaculusData(questionId: number): Promise<{
  question: MetaculusResponse["question"];
  data: ChartDataPoint[];
}> {
  const questionResponse = await fetch(`${METACULUS_API}/posts/${questionId}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!questionResponse.ok) {
    const errorText = await questionResponse.text();
    console.error("Error response body:", errorText);

    throw new Error("Failed to fetch Metaculus data");
  }

  const data: MetaculusResponse = await questionResponse.json();

  const transformed = transformMetaculusData(data);

  return { question: data.question, data: transformed };
}

function transformMetaculusData(data: MetaculusResponse): ChartDataPoint[] {
  if (!data?.question?.aggregations?.recency_weighted?.history) {
    console.error("Missing expected data structure:", {
      hasQuestion: !!data?.question,
      hasAggregations: !!data?.question?.aggregations,
      hasRecencyWeighted: !!data?.question?.aggregations?.recency_weighted,
      hasHistory: !!data?.question?.aggregations?.recency_weighted?.history,
    });
    return [];
  }

  const history = data.question.aggregations.recency_weighted.history.sort(
    (a, b) => a.start_time - b.start_time,
  );

  const start = history[0].start_time;
  const end = history[history.length - 1].start_time;

  const points: ChartDataPoint[] = [];

  const transform = getTransform(data.question.scaling);

  let index = 0;
  let currentDate = start;
  while (currentDate <= end) {
    const sample = history[index];
    const center = sample.centers[0];
    const lower = sample.interval_lower_bounds?.[0];
    const upper = sample.interval_upper_bounds?.[0];
    points.push({
      date: new Date(currentDate * 1000).toISOString(),
      value: transform(center),
      range: [transform(lower ?? 0), transform(upper ?? 0)],
    });
    currentDate += 24 * 60 * 60;

    // increment index until the next sample is after the current date
    let tmpIndex = index;
    while (
      currentDate <= end &&
      tmpIndex < history.length &&
      history[tmpIndex].start_time < currentDate
    ) {
      tmpIndex++;
    }
    index = tmpIndex - 1;
  }

  return points;
}

/**
 * Returns a function which transforms a 0-1 value into the correct value
 * based on the scaling of the question.
 */
export function getTransform(
  scaling: MetaculusResponse["question"]["scaling"],
) {
  function m() {
    return (t: number) => {
      return null == t;
    };
  }

  return (value: number) => {
    let t;
    const { range_min, range_max, zero_point } = scaling;
    if (m()(range_max) || m()(range_min)) return value;
    if (null !== zero_point) {
      const n = (range_max - zero_point) / (range_min - zero_point);
      t = range_min + ((range_max - range_min) * (n ** value - 1)) / (n - 1);
    } else
      t =
        null === range_min || null === range_max
          ? value
          : range_min + (range_max - range_min) * value;
    return t;
  };
}

/**
 * Returns a function which transforms a scaled value into it's 0-1 value.
 */
export function getInverseTransform(
  scaling: MetaculusResponse["question"]["scaling"],
) {
  function isNull(t: number) {
    return null == t;
  }

  return (value: number) => {
    const { range_min, range_max, zero_point } = scaling;
    if (isNull(range_max) || isNull(range_min)) return value;

    if (null !== zero_point) {
      // Inverse of logarithmic scaling
      const n = (range_max - zero_point) / (range_min - zero_point);
      return (
        Math.log(
          ((value - range_min) * (n - 1)) / (range_max - range_min) + 1,
        ) / Math.log(n)
      );
    } else {
      // Inverse of linear scaling
      return null === range_min || null === range_max
        ? value
        : (value - range_min) / (range_max - range_min);
    }
  };
}
