import { getManifoldHistoricalData } from "@/lib/services/manifold-historical.server";
import { downloadMetaculusData } from "@/lib/services/metaculus-download.server";
import { fetchKalshiData } from "@/lib/services/kalshi.server";
import { createIndex } from "@/lib/createIndex";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDownIcon } from "lucide-react";
import { MobileFriendlyTooltip } from "@/components/MobileFriendlyTooltip";
import { LineGraph } from "@/components/LineGraph";
import { format } from "date-fns";
import { CustomTooltip } from "@/components/CustomTooltip";
import { GraphTitle } from "@/components/GraphTitle";
import Image from "next/image";
import { CombinedForecastChart } from "@/components/CombinedForecastChart";
import { GraphFooter } from "@/components/GraphFooter";
import { IndividualForecastChart } from "@/components/IndividualForecastChart";
import { GRAPH_COLORS, SOURCE_NAMES } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-static";

export default async function ServerRenderedPage() {
  const {
    manifoldHistoricalData,
    metWeaklyGeneralAI,
    turingTestData,
    fullAgiData,
    kalshiData,
    indexData,
  } = await getForecastData();

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-gray-100 p-6 font-[family-name:var(--font-geist-sans)] text-foreground dark:bg-gray-900">
      <header className="mx-auto mb-8 w-full max-w-6xl text-center">
        <h1 className="my-4 text-2xl font-bold md:text-5xl">
          When will we achieve AGI?{" "}
          <MobileFriendlyTooltip>
            Artificial General Intelligence (AGI) denotes a highly competent
            computer system that can perform a broad set of human tasks.
            Definitions vary both as to the quality of performance (from median
            human to as good as the best humans) and the range (from most tasks
            to all tasks). The broad variety of definitions presents a problem
            for forecasts. This dashboard sidesteps this problem by taking the
            median of a set of predictions based on different definitions. See
            the FAQ for more.
          </MobileFriendlyTooltip>
        </h1>
        <p className="mb-4 text-2xl text-gray-700 dark:text-gray-300">
          {indexData && indexData.length > 0 ? (
            <>
              <span className="mb-2 block text-5xl font-bold sm:text-7xl">
                {indexData[indexData.length - 1].value}
              </span>
              {indexData[indexData.length - 1].range && (
                <span className="mb-3 block text-base text-gray-500 dark:text-gray-400">
                  (80% confidence: {indexData[indexData.length - 1].range![0]} –{" "}
                  {indexData[indexData.length - 1].range![1]})
                </span>
              )}
              Our combined forecast estimates AGI will arrive in{" "}
              {indexData[indexData.length - 1].value}, as of{" "}
              {format(new Date(), "MMMM d, yyyy")}.
            </>
          ) : (
            <>
              Comparing forecasts from Metaculus and Manifold Markets on when
              AGI will arrive, as of {format(new Date(), "MMMM d, yyyy")}.
            </>
          )}
        </p>
      </header>

      <div className="mx-auto mb-6 w-full max-w-6xl space-y-6">
        <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <GraphTitle
            title="AGI Timeline Forecasts"
            tooltipContent={
              <div className="space-y-2">
                <p>
                  This chart shows the median year predictions from four
                  different forecasting sources:
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Date of &quot;weakly general AI&quot; - Metaculus</li>
                  <li>Date of &quot;general AI&quot; - Metaculus</li>
                  <li>
                    Date of AI passing &quot;difficult Turing Test&quot; -
                    Metaculus
                  </li>
                  <li>When will AGI arrive? - Manifold</li>
                </ul>
                <p>
                  The shaded area represents uncertainty, spanning from the 10th
                  to 90th percentile of forecasts.
                </p>
                <p>
                  Each line shows how the median forecast has changed over time.
                </p>
              </div>
            }
          >
            <p className="text-sm text-gray-500">
              Median year predictions from multiple forecasting sources.
            </p>
          </GraphTitle>
          <CombinedForecastChart
            sources={[
              {
                name: SOURCE_NAMES.weakAgi,
                data: metWeaklyGeneralAI?.datapoints || [],
                color: GRAPH_COLORS.weakAgi,
                isTimestamp: true,
              },
              {
                name: SOURCE_NAMES.fullAgi,
                data: fullAgiData?.datapoints || [],
                color: GRAPH_COLORS.fullAgi,
                isTimestamp: true,
              },
              {
                name: SOURCE_NAMES.turingTest,
                data: turingTestData?.datapoints || [],
                color: GRAPH_COLORS.turingTest,
                isTimestamp: true,
              },
              {
                name: SOURCE_NAMES.manifold,
                data: manifoldHistoricalData?.data || [],
                color: GRAPH_COLORS.manifold,
                isTimestamp: false,
              },
            ]}
            indexData={indexData}
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Individual Forecasts:
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

            <IndividualForecastChart
              data={metWeaklyGeneralAI?.datapoints || []}
              color={GRAPH_COLORS.weakAgi}
              label="Metaculus Prediction (Year)"
              isTimestamp={true}
              sourceName="Metaculus"
              sourceUrl="https://www.metaculus.com/questions/3479/date-weakly-general-ai-is-publicly-known/"
              filename="metaculus-weak-agi.csv"
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
                    Resolution will come via direct demonstration of such,
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
            <IndividualForecastChart
              data={fullAgiData?.datapoints || []}
              color={GRAPH_COLORS.fullAgi}
              label="Metaculus Prediction (Year)"
              isTimestamp={true}
              sourceName="Metaculus"
              sourceUrl="https://www.metaculus.com/questions/5121/date-of-artificial-general-intelligence/"
              filename="metaculus-full-agi.csv"
            />
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
            <IndividualForecastChart
              data={turingTestData?.datapoints || []}
              color={GRAPH_COLORS.turingTest}
              label="Metaculus Prediction (Year)"
              isTimestamp={true}
              sourceName="Metaculus"
              sourceUrl="https://www.metaculus.com/questions/11861/when-will-ai-pass-a-difficult-turing-test/"
              filename="metaculus-turing-test.csv"
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="When will AGI arrive? (Manifold Markets Distribution)"
              sourceUrl="https://manifold.markets/ManifoldAI/agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708"
              tooltipContent={
                <div className="space-y-2">
                  <p>
                    The Manifold Markets question gives the following proposed
                    criteria:
                  </p>
                  <p>
                    &quot;For proposed testing criteria, refer to this Metaculus
                    Question by Matthew Barnett, or the Longbets wager between
                    Ray Kurzweil and Mitch Kapor.&quot;
                  </p>
                  <p>Our summary is there for that:</p>
                  <p>
                    This prediction resolves based on some high-quality Turing
                    test of which iether the Metaculus or Long Bets one would
                    probably be sufficient. This would likely involve a computer
                    system demonstrating human-like intelligence through
                    extended text-based conversations with expert judges who are
                    actively trying to identify the AI.
                  </p>
                  <p>
                    The test would require the AI to demonstrate natural
                    language understanding, reasoning, knowledge across domains,
                    and the ability to respond coherently to unexpected
                    questions. Resolution would occur when a credible
                    organization or panel confirms that an AI has successfully
                    passed such a test, fooling a significant portion of
                    qualified judges into believing it&apos;s human, while
                    demonstrating capabilities consistent with general
                    intelligence rather than narrow expertise.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                From the prediction market Manifold Markets, full title:
                &quot;AGI When? [High Quality Turing Test]&quot;
              </p>
            </GraphTitle>
            <IndividualForecastChart
              data={manifoldHistoricalData?.data || []}
              color={GRAPH_COLORS.manifold}
              label="Manifold Prediction (Year)"
              isTimestamp={false}
              sourceName="Manifold Markets"
              sourceUrl="https://manifold.markets/ManifoldAI/agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708"
              filename="manifold-agi.csv"
            />
          </div>

          <div className="col-span-2 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <GraphTitle
              title="Will AI pass the Turing Test before 2030? (Kalshi)"
              sourceUrl="https://kalshi.com/markets/aituring/ai-passes-turing-test"
              tooltipContent={
                <div className="space-y-2">
                  <p>
                    This is a binary prediction market on Kalshi asking whether
                    AI will pass a legitimate Turing test before 2030.
                  </p>
                  <p>
                    The market resolves YES if, before January 1, 2030, a
                    credible AI system passes a Turing test administered by a
                    reputable organization.
                  </p>
                  <p>
                    Unlike the other forecasts which predict a specific year,
                    this shows the probability that AGI-level AI arrives before
                    a fixed date.
                  </p>
                </div>
              }
            >
              <p className="text-sm text-gray-500">
                From the prediction market Kalshi. Shows probability (0-100%)
                that AI passes the Turing test before 2030.
              </p>
            </GraphTitle>
            <LineGraph
              data={kalshiData}
              color={GRAPH_COLORS.kalshi}
              label="Kalshi Prediction (% before 2030)"
              xAxisFormatter="MMM yyyy"
              yAxisProps={{
                domain: [0, 100],
              }}
              yAxisFormatter="percent"
              tooltip={<CustomTooltip labelFormatter="MMM d, yyyy" />}
            />
            <GraphFooter
              sourceName="Kalshi"
              sourceUrl="https://kalshi.com/markets/aituring/ai-passes-turing-test"
              data={kalshiData}
              filename="kalshi-turing-test.csv"
              isTimestamp={false}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-8 w-full max-w-6xl text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="mb-8 rounded-lg bg-white p-6 text-left shadow-lg dark:bg-gray-800">
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
                    AGI. Rather than pick one definition, we aggregate and
                    display predictions across different definitions to capture
                    the broader forecaster consensus on transformative AI
                    timelines.
                  </p>
                  <p>
                    It is always going to be possible to argue that the set of
                    averaged definitions is incorrectly weighted. To reduce bias
                    I seek to accept all, long-term or highly liquid forecasts
                    of AGI and then weight them equally. Perhaps we will
                    down-weight some if a single institution releases many
                    different AI forecasts.
                  </p>
                  <p>
                    If you disagree, please get in touch. If you know of some
                    other forecast of AGI that I have not included, let me know.
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
            <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
              <Collapsible.Trigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <h4 className="text-lg font-medium">
                  How is the single date (and confidence area) created?
                </h4>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <p>
                    All of these charts are turned into a single index—the index
                    is a straight average of each different source. There is one
                    deviation and some clarifications.
                  </p>
                  <p>
                    <strong>The Kalshi prediction:</strong> All the other
                    predictions are date predictions—forecasters were able to
                    give their whole range of predictions. But the Kalshi
                    prediction is a binary prediction—will the AI pass the
                    Turing test before 2030? It can only be answered with a yes
                    or no.
                  </p>
                  <p>
                    So I took the average of the other predictions, and then
                    adjusted the weights of that prediction before and after
                    2030 to make them match the Kalshi prediction. This formula
                    is as follows:
                  </p>
                  <p className="rounded bg-gray-100 p-3 font-mono text-sm dark:bg-gray-700">
                    P(AGI on date Xi, before 2030) = (average of all other
                    predictions for date Xi / average of the sum of predictions
                    on date Xi) * Kalshi P(AGI before 2030)
                  </p>
                  <p>
                    And then the index is the average of all Xi values,
                    including this new one for Kalshi.
                  </p>
                  <p>
                    If you want a longer explanation, I&apos;ve tried putting
                    this into Claude and it seems to understand and be able to
                    answer questions. So literally copy the above block.
                  </p>
                  <p>
                    <strong>The confidence area:</strong> This is the 80% (10th
                    and 90th) confidence interval on the lines in the chart.
                    It&apos;s not just the union of their own 80% confidence
                    intervals, since that would be far wider.
                  </p>
                  <p>
                    <strong>The Manifold prediction:</strong> This has a 2050
                    end date. There is a moderate bump in probability in this
                    bucket. This should probably be clarified to mean that any
                    time after 2049 resolves to the 2050 bucket, since that
                    seems to be what people have understood it to mean. There
                    isn&apos;t much probability in the bucket so we have ignored
                    this, but we could return to it.
                  </p>
                  <p>
                    <strong>Date prediction buckets:</strong> The date
                    predictions have different buckets. I can&apos;t remember
                    what we did with them but I guess we averaged across
                    buckets. This is plausibly less accurate than fitting them
                    to a curve and using that to do a weighted average, but
                    we&apos;re using it for medians, 10th and 90th percentiles.
                    I doubt it makes much difference.
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
            <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
              <Collapsible.Trigger className="group flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <h4 className="text-lg font-medium">
                  What does this mean for me?
                </h4>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <p>
                    This site isn&apos;t here to tell you what to do about
                    Artificial General Intelligence. But seeing these
                    predictions of when it will arrive could cause you to make
                    different choices.
                  </p>
                  <p>
                    Whatever the current date is, that&apos;s my, Nathan
                    Young&apos;s, best consensus guess at roughly when computers
                    will do human work. I think that this world will be a
                    strange one and that it&apos;s worth preparing both
                    practically and emotionally.
                  </p>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
            <Collapsible.Root className="rounded border border-gray-200 dark:border-gray-700">
              <Collapsible.Trigger className="group flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:text-gray-100">
                <h4 className="text-lg font-medium">Why 80% confidence?</h4>
                <ChevronDownIcon className="h-5 w-5 text-gray-500 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
              </Collapsible.Trigger>
              <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="space-y-4 border-t border-gray-200 p-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  <p>
                    The 80% confidence interval is calculated using the 10th and
                    90th percentiles from the combined forecast distribution.
                    This means there&apos;s roughly a 10% chance AGI arrives
                    before the lower bound and a 10% chance it arrives after the
                    upper bound.
                  </p>
                  <p>
                    We chose 80% because it provides a meaningful range without
                    being so wide as to be uninformative. This could change in
                    the future if there&apos;s good reason to use a different
                    interval.
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

        <div className="mb-1">
          Funded by{" "}
          <a
            href="https://en.wikipedia.org/wiki/Jaan_Tallinn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            Jaan Tallinn
          </a>
        </div>

        <div className="mb-1">
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            CC BY 4.0
          </a>
        </div>

        <span>&nbsp;</span>
      </footer>
    </div>
  );
}

async function getForecastData() {
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

  if (
    metWeaklyGeneralAI.status === "fulfilled" &&
    fullAgiData.status === "fulfilled" &&
    turingTestData.status === "fulfilled" &&
    manifoldHistoricalData.status === "fulfilled" &&
    kalshiData.status === "fulfilled"
  ) {
    // Compute the index with all sources including Kalshi
    const { data: indexData } = createIndex(
      metWeaklyGeneralAI.value,
      fullAgiData.value,
      turingTestData.value,
      manifoldHistoricalData.value,
      kalshiData.value,
    );

    return {
      metWeaklyGeneralAI: metWeaklyGeneralAI.value,
      fullAgiData: fullAgiData.value,
      turingTestData: turingTestData.value,
      manifoldHistoricalData: manifoldHistoricalData.value,
      kalshiData: kalshiData.value,
      indexData,
    };
  }

  // Show which ones failed
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

  console.error(`Error fetching data: ${JSON.stringify(failures)}`);

  throw new Error(`Error fetching data: ${JSON.stringify(failures)}`);
}
