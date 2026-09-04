import { getManifoldHistoricalData } from "./services/manifold-historical.server";
import { downloadMetaculusData } from "./services/metaculus-download.server";
import { fetchKalshiData } from "./services/kalshi.server";
import { createIndex } from "./createIndex";

export async function getForecastData() {
  const [
    fullAgiData,
    metWeaklyGeneralAI,
    turingTestData,
    manifoldHistoricalData,
    kalshiData,
  ] = await Promise.allSettled([
    downloadMetaculusData(5121),
    downloadMetaculusData(3479),
    downloadMetaculusData(11861),
    getManifoldHistoricalData(
      "agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708",
    ),
    fetchKalshiData({
      seriesTicker: "KXAITURING",
      marketTicker: "AITURING",
      period_interval: 24 * 60,
    }),
  ]);

  // Log any failures but continue with partial data
  const failures = {
    metWeaklyGeneralAI:
      metWeaklyGeneralAI.status === "rejected"
        ? metWeaklyGeneralAI.reason
        : null,
    fullAgiData: fullAgiData.status === "rejected" ? fullAgiData.reason : null,
    turingTestData:
      turingTestData.status === "rejected" ? turingTestData.reason : null,
    manifoldHistoricalData:
      manifoldHistoricalData.status === "rejected"
        ? manifoldHistoricalData.reason
        : null,
    kalshiData: kalshiData.status === "rejected" ? kalshiData.reason : null,
  };

  const hasFailures = Object.values(failures).some((f) => f !== null);
  if (hasFailures) {
    console.warn("Some data sources failed to load:", failures);
  }

  // Use successful data or null for failed fetches
  const metWeaklyGeneralAIData =
    metWeaklyGeneralAI.status === "fulfilled" ? metWeaklyGeneralAI.value : null;
  const fullAgiDataValue =
    fullAgiData.status === "fulfilled" ? fullAgiData.value : null;
  const turingTestDataValue =
    turingTestData.status === "fulfilled" ? turingTestData.value : null;
  const manifoldHistoricalDataValue =
    manifoldHistoricalData.status === "fulfilled"
      ? manifoldHistoricalData.value
      : null;
  const kalshiDataValue =
    kalshiData.status === "fulfilled" ? kalshiData.value : null;

  // Compute the index only if all required sources are available
  // createIndex requires all 4 main sources; Kalshi is optional (handled internally)
  const canComputeIndex =
    metWeaklyGeneralAIData &&
    fullAgiDataValue &&
    turingTestDataValue &&
    manifoldHistoricalDataValue;

  let indexData: ReturnType<typeof createIndex>["data"] = [];
  if (canComputeIndex) {
    const result = createIndex(
      metWeaklyGeneralAIData,
      fullAgiDataValue,
      turingTestDataValue,
      manifoldHistoricalDataValue,
      kalshiDataValue || [],
    );
    indexData = result.data;
  }

  return {
    metWeaklyGeneralAI: metWeaklyGeneralAIData,
    fullAgiData: fullAgiDataValue,
    turingTestData: turingTestDataValue,
    manifoldHistoricalData: manifoldHistoricalDataValue,
    kalshiData: kalshiDataValue,
    indexData,
  };
}
