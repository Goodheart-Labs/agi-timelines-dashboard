import { createIndex } from "@/lib/createIndex";
import { fetchKalshiData } from "@/lib/services/kalshi.server";
import { getManifoldHistoricalData } from "@/lib/services/manifold-historical.server";
import { downloadMetaculusData } from "@/lib/services/metaculus-download.server";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDownIcon } from "lucide-react";
import { MobileFriendlyTooltip } from "@/components/MobileFriendlyTooltip";
import { LineGraph } from "@/components/LineGraph";
import { format } from "date-fns";
import { CustomTooltip } from "@/components/CustomTooltip";
import { GraphTitle } from "@/components/GraphTitle";
import Image from "next/image";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-static";

export default async function ServerRenderedPage() {
  const {
    indexData,
    manifoldHistoricalData,
    metWeaklyGeneralAI,
    turingTestData,
    fullAgiData,
    kalshiData,
  } = await getIndexData();

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-gray-100 p-6 font-[family-name:var(--font-geist-sans)] text-foreground dark:bg-gray-900">
      <header className="mx-auto mb-8 w-full max-w-6xl text-center">
        <h1 className="my-4 text-2xl font-bold md:text-5xl">
          When will we achieve AGI?{" "}
          <MobileFriendlyTooltip>
            Artificial General Intelligence (AGI) demotes a highly competent
            computer system that can perform a broad set of human tasks.
            Definitions vary both as to the quality of performance (from median
            human to as good as the best humans) and the range (from most tasks
            to all tasks). The broad variety of definitions presents a problem
            for forecasts. This dashboard sidesteps this problem by taking the
            median of a set of predictions based on different definitions. See
            the FAQ for more.
          </MobileFriendlyTooltip>
        </h1>
        <p className="mb-4 min-h-[108px] text-2xl text-gray-700 dark:text-gray-300">
          {!indexData.length ? (
            "Loading timeline assessment..."
          ) : (
            <>
              <span className="mb-4 block text-4xl font-bold sm:text-6xl">
                {indexData[indexData.length - 1].value}
              </span>{" "}
              Our AGI index predicts artificial general intelligence will arrive
              in {indexData[indexData.length - 1].value} as of{" "}
              <span className="inline-flex items-center">
                {format(new Date(), "MMMM d, yyyy")}
                <MobileFriendlyTooltip>
                  The index is an average of predictions from Metaculus and
                  Manifold Markets. Metaculus is a forecasting community with a
                  strong track record, while Manifold Markets is a prediction
                  market platform. The index combines multiple definitions of
                  AGI to provide a more robust estimate.
                </MobileFriendlyTooltip>
              </span>
            </>
          )}
        </p>
      </header>

      {indexData && (
        <div className="mx-auto mb-6 w-full max-w-6xl space-y-6">
          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <LineGraph
              data={indexData}
              color="#4f46e5"
              label="AGI Index"
              xAxisFormatter="MMM yyyy"
              yAxisProps={{
                domain: [2024, 2100],
              }}
              tooltip={
                <CustomTooltip
                  // formatter="MMM d, yyyy"
                  labelFormatter="MMM d, yyyy"
                />
              }
              lineProps={{
                min: 2020,
                max: 2130,
              }}
            />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Included in index:
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title='Date of "weakly general AI" - Metaculus'
              sourceUrl="https://www.metaculus.com/questions/3479/date-weakly-general-ai-is-publicly-known/"
              tooltipContent={
                <div className="space-y-2">
                  <p>A summary of Metaculus&apos; resolution criteria:</p>
                  <p>
                    For these purposes they define &quot;AI system&quot; as a
                    single unified software system that can satisfy the
                    following criteria, all easily completable by a typical
                    college-educated human:
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      Able to reliably pass a Turing test of the type that would
                      win the Loebner Silver Prize
                    </li>
                    <li>
                      Able to score 90% or more on a robust version of the
                      Winograd Schema Challenge
                    </li>
                    <li>
                      Be able to score 75th percentile on all the full
                      mathematics section of a circa-2015-2020 standard SAT exam
                    </li>
                    <li>
                      Be able to learn the classic Atari game
                      &quot;Montezuma&apos;s revenge&quot; and explore all 24
                      rooms in under 100 hours of play
                    </li>
                  </ul>
                  <p>
                    The system must be integrated enough to explain its
                    reasoning and verbally report its progress across all tasks.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                From the forecasting site Metaculus, full title: &quot;When will
                the first weakly general AI system be devised, tested, and
                publicly announced?&quot;
              </p>
            </GraphTitle>

            <LineGraph
              data={metWeaklyGeneralAI?.datapoints || []}
              color="#22c55e"
              key="different-data"
              label="Metaculus Prediction (Year)"
              xAxisFormatter="MMM yyyy"
              yAxisProps={{
                scale: "log",
                domain: metWeaklyGeneralAI?.question
                  ? [
                      metWeaklyGeneralAI.question.scaling.range_min,
                      metWeaklyGeneralAI.question.scaling.range_max,
                    ]
                  : undefined,
              }}
              yAxisFormatter="ms:yyyy"
              tooltip={
                <CustomTooltip
                  formatter="ms:yyyy-MM-dd"
                  labelFormatter="MMM d, yyyy"
                />
              }
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title='Date of "general AI" - Metaculus'
              sourceUrl="https://www.metaculus.com/questions/5121/date-of-artificial-general-intelligence/"
              tooltipContent={
                <div className="space-y-2">
                  <p>A summary of Metaculus&apos; resolution criteria:</p>
                  <p>
                    They define &quot;AI system&quot; as a single unified system
                    that can:
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      Pass a 2-hour adversarial Turing test with text, images,
                      and audio
                    </li>
                    <li>
                      Assemble a complex model car from instructions
                      (demonstrating robotic capability)
                    </li>
                    <li>
                      Score 75%+ on every task and 90%+ mean accuracy across the
                      Hendrycks Q&A dataset
                    </li>
                    <li>
                      Achieve 90%+ accuracy on interview-level programming
                      problems
                    </li>
                  </ul>
                  <p>
                    The system must be truly unified - able to explain its
                    reasoning and describe its progress across all tasks.
                  </p>
                  <p>
                    Resolution will come via, direct demostration of such,
                    confident credible statements from developers or judgement
                    by a special panel composed by Metaculus.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                From the forecasting site Metaculus, full title: &quot;When will
                the first general AI system be devised, tested, and publicly
                announced?&quot;
              </p>
            </GraphTitle>
            <LineGraph
              data={fullAgiData ? fullAgiData.datapoints : []}
              color="#06b6d4"
              label="Metaculus Prediction (Year)"
              xAxisFormatter="MMM yyyy"
              yAxisProps={{
                scale: "linear",
                domain: fullAgiData
                  ? [
                      fullAgiData.question.scaling.range_min,
                      fullAgiData.question.scaling.range_max,
                    ]
                  : undefined,
              }}
              yAxisFormatter="ms:yyyy"
              tooltip={
                <CustomTooltip
                  formatter="ms:yyyy-MM-dd"
                  labelFormatter="MMM d, yyyy"
                />
              }
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="When will AGI arrive? (Manifold Markets Distribution)"
              sourceUrl="https://manifold.markets/ManifoldAI/agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708"
              tooltipContent="Distribution of predictions for when AGI will first pass a high-quality Turing test"
            />
            {manifoldHistoricalData && (
              <LineGraph
                data={manifoldHistoricalData.data}
                color="#4f46e5"
                label="Manifold Prediction (Year)"
                xAxisFormatter="MMM yyyy"
                yAxisProps={{
                  domain: [2020, 2055],
                }}
                tooltip={<CustomTooltip labelFormatter="MMM d, yyyy" />}
              />
            )}
          </div>
          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title='Date of AI passing "difficult Turing Test" - Metaculus'
              sourceUrl="https://www.metaculus.com/questions/11861/when-will-ai-pass-a-difficult-turing-test/"
              tooltipContent={
                <div className="space-y-2">
                  <p>A summary of Metaculus&apos; resolution criteria:</p>
                  <p>
                    The question resolves when an AI system passes a
                    high-quality Turing test that demonstrates extensive
                    knowledge, natural language mastery, common sense, and
                    human-level reasoning. The test must be:
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>
                      <strong>Long:</strong> At least 2 consecutive hours of
                      communication
                    </li>
                    <li>
                      <strong>Informed:</strong> Judges must have PhD-level
                      understanding of AI limitations, and confederates must
                      have PhD-level expertise in STEM
                    </li>
                    <li>
                      <strong>Adversarial:</strong> Judges actively try to
                      unmask the AI, confederates demonstrate their humanity
                    </li>
                    <li>
                      <strong>Passing criteria:</strong> At least 50% of judges
                      must rate the AI as more human than 33% of human
                      confederates
                    </li>
                  </ul>
                  <p>
                    All participants must understand their role is to ensure the
                    AI fails. Tests with cheating or conflicts of interest will
                    be excluded.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                From the forecasting site Metaculus, full title: &quot;When will
                an AI first pass a long, informed, adversarial Turing
                test?&quot;
              </p>
            </GraphTitle>
            <LineGraph
              data={turingTestData ? turingTestData.datapoints : []}
              color="#0ea5e9"
              label="Metaculus Prediction (Year)"
              xAxisFormatter="MMM yyyy"
              yAxisProps={{
                scale: "linear",
                domain: turingTestData
                  ? [
                      turingTestData.question.scaling.range_min,
                      turingTestData.question.scaling.range_max,
                    ]
                  : undefined,
              }}
              yAxisFormatter="ms:yyyy"
              tooltip={
                <CustomTooltip
                  formatter="ms:yyyy-MM-dd"
                  labelFormatter="MMM d, yyyy"
                />
              }
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="AI passes Turing test before 2030?"
              sourceUrl="https://kalshi.com/markets/kxaituring/ai-turing-test"
              tooltipContent=""
            />
            <LineGraph
              data={kalshiData}
              color="#8b5cf6"
              label="Kalshi Prediction (%)"
              xAxisFormatter="MMM d"
              yAxisProps={{
                domain: [60, 80],
              }}
              tooltip={<CustomTooltip labelFormatter="MMM d, yyyy" />}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-8 w-full max-w-6xl text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <h3 className="mb-2 text-lg font-semibold">Stay Updated</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Get updated on if H5N1 risk levels change significantly or if we
            build another dashboard for some comparable risk. Your email will
            not be used for other purposes.
          </p>
        </div>
        <div className="mb-8 mt-8 rounded-lg bg-white p-6 text-left shadow-lg dark:bg-gray-800">
          <h3 className="mb-6 text-2xl font-semibold">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">
            <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
              <Collapsible.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <h4 className="text-lg font-medium">
                  Why no specific definition of AGI?
                </h4>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <p>
                    There is significant disagreement about what constitutes
                    AGI. Rather than pick one definition, we aggregate
                    predictions across different definitions to capture the
                    broader expert consensus on transformative AI timelines.
                  </p>
                  <p>
                    It is always going to be possible to argue that the set of
                    averaged definitions is incorrectly weighted. To reduce
                    biase I seek to accept all, long-term, repeating forecasts
                    of AGI and then weight them equally. Perhaps we will
                    down-weight some if some if a single institution releases
                    many different AI forecasts
                  </p>
                  <p>
                    If you disagree, please get in touch. If you know of some
                    other repeating forecast of AGI that I have not included,
                    let me know.
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
            <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
              <Collapsible.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <h4 className="text-lg font-medium">
                  How is the risk index calculated?
                </h4>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <p>
                    We have three individual data sources that relate to whether
                    bird flu will be bad, but even if they all resolve positive,
                    we might only have something like winter flu.
                  </p>
                  <p>
                    As a result I, Nathan Young, have used my professional
                    judgement as a forecaster, to assign a conditional
                    probability to each datasource that if it resolves positive,
                    the actual central question does.
                  </p>
                  <p className="font-mono text-sm">
                    ie P(bird flu as bad as covid) = P(bird flu as bad as covid
                    | 10,000 US cases) x P(10,000 US cases)
                  </p>
                  <p>
                    If this page gets lots of traffic, I will crowdsource P(bird
                    flu as bad as covid | 10,000 US cases), but as it is, I made
                    a guess.
                  </p>
                  <p>
                    Next we have three of these, and I have taken the average.
                  </p>
                  <p>So the full forecast is as follows:</p>
                  <p className="whitespace-pre-wrap font-mono text-sm">
                    Index = ( Nathan&apos;s estimate of P(bird flu as bad as
                    covid | 10,000 US cases) × Current Metaculus P(10,000 US
                    cases) + Nathan&apos;s estimate of P(bird flu as bad as
                    covid | 10,000 US cases) × Current Kalshi P(10,000 US cases)
                    + Nathan&apos;s estimate of P(bird flu as bad as covid | CDC
                    travel advisory) × Current Kalshi P(CDC travel advisory) ) ÷
                    3
                  </p>
                  <p>The weights are .5, .5 and .1 respectively.</p>
                  <p>
                    I may be wrong here, but I really do not think a straight or
                    weighted average is the right answer. I agree that I should
                    take some group median on these made up values.
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
        </div>

        <div className="mb-1 text-center">
          <a
            href="https://github.com/Goodheart-Labs/agi-timelines-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            View the source code on GitHub
          </a>
        </div>
        <div className="mb-1 text-gray-600 dark:text-gray-300">
          If you want to support more work like this,{" "}
          <a
            href="https://nathanpmyoung.substack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            buy a paid subscription to Predictive Text
          </a>
        </div>

        <div className="mb-1">
          Built by&nbsp;
          <span className="inline-flex items-center gap-2">
            <a
              href="https://x.com/NathanpmYoung"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600"
            >
              Nathan Young
              <Image
                src="https://unavatar.io/twitter/NathanpmYoung"
                alt="Nathan Young"
                className="rounded-full"
                width={24}
                height={24}
              />
            </a>
          </span>
          <span>&nbsp;and&nbsp;</span>
          <span className="inline-flex items-center">
            <a
              href="https://x.com/tone_row_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-blue-600"
            >
              Rob Gordon
              <Image
                src="https://unavatar.io/twitter/tone_row_"
                alt="Rob Gordon"
                className="rounded-full"
                width={24}
                height={24}
              />
            </a>
            <span>&nbsp;of&nbsp;</span>
            <a
              href="https://goodheartlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Goodheart Labs
            </a>
          </span>
        </div>

        <span>&nbsp;</span>
      </footer>
    </div>
  );
}

async function getIndexData() {
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
      marketId: "8a66420d-4b3c-446b-bd62-8386637ad844",
      period_interval: 24 * 60,
    }),
  ]);

  let indexData: null | Awaited<ReturnType<typeof createIndex>> = null;

  if (
    metWeaklyGeneralAI.status === "fulfilled" &&
    fullAgiData.status === "fulfilled" &&
    turingTestData.status === "fulfilled" &&
    manifoldHistoricalData.status === "fulfilled" &&
    kalshiData.status === "fulfilled"
  ) {
    indexData = createIndex(
      metWeaklyGeneralAI.value,
      fullAgiData.value,
      turingTestData.value,
      manifoldHistoricalData.value,
      kalshiData.value,
    );

    return {
      indexData,
      metWeaklyGeneralAI: metWeaklyGeneralAI.value,
      fullAgiData: fullAgiData.value,
      turingTestData: turingTestData.value,
      manifoldHistoricalData: manifoldHistoricalData.value,
      kalshiData: kalshiData.value,
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
