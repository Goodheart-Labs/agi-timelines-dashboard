import { ChartDataPoint, PolymarketResponse } from "../types";

const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";

export async function fetchPolymarketData(
  slug: string,
): Promise<ChartDataPoint[]> {
  // First fetch the event to get market data
  const eventResponse = await fetch(`${GAMMA_API}/events?slug=${slug}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!eventResponse.ok) {
    throw new Error(
      `Failed to fetch Polymarket event: ${eventResponse.status}`,
    );
  }

  const events = await eventResponse.json();

  if (!events?.[0]) {
    throw new Error("No events found for this slug");
  }

  const event = events[0];
  if (!event.markets?.[0]) {
    throw new Error("No markets found for this event");
  }

  // Get the market data to find the clobTokenIds
  const marketId = event.markets[0].id;
  const marketResponse = await fetch(`${GAMMA_API}/markets/${marketId}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!marketResponse.ok) {
    throw new Error(
      `Failed to fetch Polymarket market: ${marketResponse.status}`,
    );
  }

  const marketData = await marketResponse.json();

  // Get the first clobTokenId from the clobTokenIds array
  const clobTokenIds = JSON.parse(marketData.clobTokenIds);
  const clobTokenId = clobTokenIds[0];

  // Fetch the price history timeseries
  const url = new URL(`${CLOB_API}/prices-history`);
  url.search = new URLSearchParams({
    market: clobTokenId,
    interval: "1m",
    fidelity: "60",
  }).toString();

  const timeseriesResponse = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!timeseriesResponse.ok) {
    throw new Error(
      `Failed to fetch Polymarket timeseries: ${timeseriesResponse.status}`,
    );
  }

  const timeseriesData: PolymarketResponse = await timeseriesResponse.json();

  return transformPolymarketData(timeseriesData);
}

function transformPolymarketData(data: PolymarketResponse): ChartDataPoint[] {
  if (!data?.history) {
    return [];
  }
  return data.history.map((point) => ({
    date: new Date(point.t * 1000).toISOString(),
    value: point.p * 100,
  }));
}
