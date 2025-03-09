import { createIndex } from "@/lib/createIndex";
import { fetchKalshiData } from "@/lib/services/kalshi.server";
import { getManifoldHistoricalData } from "@/lib/services/manifold-historical.server";
import { fetchMetaculusData } from "@/lib/services/metaculus.server";
import { downloadMetaculusData } from "@/lib/services/metaculus-download.server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-static";

export default async function ServerRenderedPage() {
  const [index, kalshiData, turingTestData] = await Promise.allSettled([
    getIndexData(),
    fetchKalshiData({
      seriesTicker: "KXAITURING",
      marketTicker: "AITURING",
      marketId: "8a66420d-4b3c-446b-bd62-8386637ad844",
      period_interval: 24 * 60,
    }),
    fetchMetaculusData(11861),
  ]);

  if (
    [index, kalshiData, turingTestData].some((p) => p.status === "rejected")
  ) {
    const failures = {
      index: index.status === "rejected" ? index.reason : null,
      kalshi: kalshiData.status === "rejected" ? kalshiData.reason : null,
      turingTest:
        turingTestData.status === "rejected" ? turingTestData.reason : null,
    };
    throw new Error(`Failed to fetch data: ${JSON.stringify(failures)}`);
  }

  return (
    <div>
      {JSON.stringify({ index, kalshiData, turingTestData }).slice(0, 1000)}...
    </div>
  );
}

async function getIndexData() {
  const [fullAgiData, metWeaklyGeneralAI, manifoldHistoricalData] =
    await Promise.allSettled([
      downloadMetaculusData(5121),
      downloadMetaculusData(3479),
      getManifoldHistoricalData(
        "agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708",
      ),
    ]);

  let indexData: null | Awaited<ReturnType<typeof createIndex>> = null;

  if (
    metWeaklyGeneralAI.status === "fulfilled" &&
    fullAgiData.status === "fulfilled" &&
    manifoldHistoricalData.status === "fulfilled"
  ) {
    indexData = createIndex(
      metWeaklyGeneralAI.value,
      fullAgiData.value,
      manifoldHistoricalData.value,
    );

    return {
      indexData,
      metWeaklyGeneralAI: metWeaklyGeneralAI.value,
      fullAgiData: fullAgiData.value,
      manifoldHistoricalData: manifoldHistoricalData.value,
    };
  }

  // Show which ones failed
  const failures = {
    metWeaklyGeneralAI:
      metWeaklyGeneralAI.status === "rejected"
        ? metWeaklyGeneralAI.reason
        : null,
    fullAgiData: fullAgiData.status === "rejected" ? fullAgiData.reason : null,
    manifoldHistoricalData:
      manifoldHistoricalData.status === "rejected"
        ? manifoldHistoricalData.reason
        : null,
  };

  console.error(`Error fetching data: ${JSON.stringify(failures)}`);

  throw new Error(`Error fetching data: ${JSON.stringify(failures)}`);
}
