import { unstable_cache } from "next/cache";
import { getForecastData } from "@/lib/forecast-data.server";
import type { ChartDataPoint } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

function years(points: ChartDataPoint[] = []): ChartDataPoint[] {
  return points.map((point) => ({
    ...point,
    value: new Date(point.value * 1000).getUTCFullYear(),
    range: point.range
      ? [
          new Date(point.range[0] * 1000).getUTCFullYear(),
          new Date(point.range[1] * 1000).getUTCFullYear(),
        ]
      : undefined,
  }));
}

// Retain the original collectors and index calculation, including credentials on
// this server. Only the public chart series cross to Global Risk Odds.
const dashboard = unstable_cache(
  async () => {
    const data = await getForecastData();
    if (!data.indexData.length)
      throw new Error("Required AGI forecast sources unavailable");
    return {
      generatedAt: new Date().toISOString(),
      unavailableSources: data.kalshiData?.length ? [] : ["kalshi"],
      index: data.indexData,
      sources: [
        {
          id: "weak-agi",
          name: "Metaculus · Weak AGI",
          color: "#D97757",
          kind: "year",
          url: "https://www.metaculus.com/questions/3479/date-weakly-general-ai-is-publicly-known/",
          definition:
            "A unified system meeting the question’s Turing-test, language, mathematics and Atari-game benchmarks. This is a weaker definition than the general-AI question.",
          points: years(data.metWeaklyGeneralAI?.datapoints),
        },
        {
          id: "full-agi",
          name: "Metaculus · General AI",
          color: "#2563EB",
          kind: "year",
          url: "https://www.metaculus.com/questions/5121/date-of-artificial-general-intelligence/",
          definition:
            "A unified system meeting the question’s adversarial Turing-test, robotics, knowledge and programming benchmarks.",
          points: years(data.fullAgiData?.datapoints),
        },
        {
          id: "turing",
          name: "Metaculus · Difficult Turing test",
          color: "#10A37F",
          kind: "year",
          url: "https://www.metaculus.com/questions/11861/when-will-ai-pass-a-difficult-turing-test/",
          definition:
            "Passing a long, informed, adversarial Turing test. This tests a different capability from the broader AGI questions.",
          points: years(data.turingTestData?.datapoints),
        },
        {
          id: "manifold",
          name: "Manifold",
          color: "#7C3AED",
          kind: "year",
          url: "https://manifold.markets/ManifoldAI/agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708",
          definition:
            "A distribution over the year of AGI under this market’s high-quality Turing-test definition.",
          points: data.manifoldHistoricalData?.data ?? [],
        },
        {
          id: "kalshi",
          name: "Kalshi",
          color: "#B7791F",
          kind: "probability",
          url: "https://kalshi.com/markets/kxaituring",
          definition:
            "Probability that AI passes the Turing test before 2030. This is a probability by a deadline, not a predicted arrival year.",
          points: data.kalshiData ?? [],
        },
      ],
    };
  },
  ["global-risk-agi-dashboard-v1"],
  { revalidate: 1800 },
);

export async function GET() {
  try {
    return Response.json(await dashboard(), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return Response.json(
      { error: "AGI forecasts temporarily unavailable" },
      {
        status: 503,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
