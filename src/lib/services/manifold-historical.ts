import { Bet, ChartDataPoint } from "../types";

export async function getManifoldHistoricalData(slug: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("slug", slug);
  const response = await fetch(`/api/manifold-historical?${searchParams}`);
  const { bets } = (await response.json()) as { bets: Bet[] };

  // get oldest bet
  const oldestBet = bets.sort((a, b) => a.createdTime - b.createdTime)[0];

  // parse date from createdTime
  const startDate = new Date(oldestBet.createdTime);

  // step through dates 1 day at a time
  const dates = [];
  let index = 0;
  for (
    let date = startDate;
    date <= new Date();
    date.setDate(date.getDate() + 1)
  ) {
    const dateTime = date.getTime();

    // find the index of the first bet after the date
    let nextIndex = index;
    while (
      nextIndex < bets.length &&
      new Date(bets[nextIndex].createdTime) <= date
    ) {
      nextIndex++;
    }

    // get all the bets from the cursor
    const betsInRange = bets.slice(index, nextIndex);

    // Begin with the previous probabilities
    const probabilities: Partial<Record<Year, number>> = {
      ...(dates[dates.length - 1]?.probabilities || {}),
    };

    // loop over the bets
    for (const bet of betsInRange) {
      const answerId = bet.answerId as AnswerId;
      const year = answerIdToYear[answerId];
      probabilities[year] = bet.probAfter;
    }

    dates.push({ date: dateTime, probabilities });

    index = nextIndex;
  }

  // Find the first date with all years
  const firstDateWithAllYears = dates.findIndex(
    (date) =>
      Object.keys(date.probabilities).length ===
      Object.keys(answerIdToYear).length,
  );

  const data: ChartDataPoint[] = [];
  // Loop over dates which contain all years
  for (const date of dates.slice(firstDateWithAllYears)) {
    // Probabilities don't always sum to 1, because we're using
    // the most recent probability after a given bet was made.
    const sum = Object.values(date.probabilities).reduce<number>(
      (acc, curr) => (acc ?? 0) + (curr ?? 0),
      0,
    );

    let year = 2024,
      counter = 0;
    let lower = 0;
    let median = 0;
    let upper = 0;
    while (year <= 2049 && counter <= 10) {
      const probability = date.probabilities[year];
      if (probability) {
        counter += probability / sum;
        if (counter > 0.1 && !lower) {
          lower = year;
        }
        if (counter > 0.5 && !median) {
          median = year;
        }
        if (counter > 0.9 && !upper) {
          upper = year;
        }
      }
      year++;
    }

    data.push({
      date: new Date(date.date).toISOString(),
      value: median,
      range: [lower, upper],
    });
  }

  return data;
}

export const answerIdToYear = {
  "2cdb91507b0d": 2024,
  ed73a628dbcc: 2025,
  e8aae6520563: 2026,
  "67ea62c46640": 2027,
  "1d0fd5249e2c": 2028,
  fc63e30d0cd3: 2029,
  "5d48ed784957": 2030,
  da223cf612c4: 2031,
  "1120df2c949a": 2032,
  "77f7e579eac6": 2033,
  c398134a9e34: 2034,
  b586da03d2ec: 2035,
  a6051fa037db: 2036,
  "4271e6a3e455": 2037,
  aa017a9cebe3: 2038,
  "46ff975d1efe": 2039,
  cccb4c406baf: 2040,
  "9ae19221aa18": 2041,
  "6039886c26fa": 2042,
  "4322a973f59c": 2043,
  "1f24b6787f0d": 2044,
  "0f172ca6223b": 2045,
  "9b885d17779f": 2046,
  "9199140a0c5f": 2047,
  "659fc2df1d1d": 2048,
  c43dc66076d5: 2049,
};

type AnswerId = keyof typeof answerIdToYear;
type Year = (typeof answerIdToYear)[AnswerId];
