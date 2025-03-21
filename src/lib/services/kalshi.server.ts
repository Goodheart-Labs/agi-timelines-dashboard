import { kalshiFetch } from "../kalshi/fetch";
import { ChartDataPoint, KalshiResponse } from "../types";

export async function fetchKalshiData({
  marketTicker,
  seriesTicker,
  marketId,
  period_interval,
}: {
  marketId: string;
  marketTicker: string;
  seriesTicker?: string;
  period_interval: number;
}): Promise<ChartDataPoint[]> {
  const data = await fetchFromAPI({
    marketId,
    marketTicker,
    seriesTicker,
    period_interval,
  });

  return transformKalshiData(data, period_interval);
}

async function fetchFromAPI({
  marketTicker,
  seriesTicker,
  marketId,
  period_interval,
}: {
  marketId: string;
  marketTicker: string;
  seriesTicker?: string;
  period_interval: number;
}): Promise<KalshiResponse> {
  const marketData = await kalshiFetch(`/markets/${marketTicker}`);
  const start_ts = Math.floor(
    new Date(marketData.market.open_time).getTime() / 1000,
  );
  const end_ts = Math.floor(
    new Date(marketData.market.close_time).getTime() / 1000,
  );

  const candlesticks = await kalshiFetch(
    `/series/${seriesTicker ?? marketTicker}/markets/${marketId}/candlesticks`,
    {
      query: {
        start_ts,
        end_ts,
        period_interval,
      },
    },
  );

  return {
    marketData,
    candlesticks,
    dateRange: {
      start: marketData.market.open_time,
      end: marketData.market.close_time,
      interval: period_interval,
    },
  };
}

function transformKalshiData(
  data: KalshiResponse,
  intervalHours: number,
): ChartDataPoint[] {
  if (!data?.candlesticks?.candlesticks) return [];

  const candlesticks = data.candlesticks.candlesticks;
  if (candlesticks.length === 0) return [];

  const firstDate = candlesticks[0].end_period_ts;
  const lastDate = candlesticks[candlesticks.length - 1].end_period_ts;

  const dataPoints: ChartDataPoint[] = [];
  let currentDate = firstDate;
  let lastValidMean: number | null = null;
  let lastCandlestickIndex = 0;

  while (currentDate <= lastDate) {
    let candlestick = null;
    for (let i = lastCandlestickIndex; i < candlesticks.length; i++) {
      const stick = candlesticks[i];
      if (stick.end_period_ts >= currentDate) {
        candlestick = stick;
        lastCandlestickIndex = i;
        break;
      }
    }

    if (!candlestick) {
      currentDate += intervalHours * 60;
      continue;
    }

    // Update lastValidMean if we have a new mean price
    if (candlestick.price.mean !== null) {
      lastValidMean = candlestick.price.mean;
    }

    // If we don't have any valid mean yet, use mid price
    const value =
      lastValidMean ??
      Math.round((candlestick.yes_bid.close + candlestick.yes_ask.close) / 2);

    dataPoints.push({
      date: new Date(currentDate * 1000).toISOString(),
      value,
    });

    currentDate += intervalHours * 60;
  }

  return dataPoints;
}
