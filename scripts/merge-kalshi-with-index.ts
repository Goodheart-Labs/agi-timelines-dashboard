/**
 * 2024-2199
 * Array of 176 elements
 */

import { getNearestKalshiIndex } from "@/lib/kalshi/index-helpers";
import indexData from "./_averages.json";
import kalshiData from "./kalshiData.json";

const startYear = 2024;

const years = indexData as { date: number; years: number[] }[];
const kalshi = kalshiData as { date: string; value: number }[];

// What's the range of kalshi dates?
const kalshiDates = kalshi.map((k) => new Date(k.date).getTime());
const minKalshiDate = new Date(Math.min(...kalshiDates)).toDateString();
const maxKalshiDate = new Date(Math.max(...kalshiDates)).toDateString();
console.log(`Kalshi Date Range: \n${minKalshiDate} to \n${maxKalshiDate}\n\n`);

// Take a random day from the years
const randomDay = years[years.length - Math.floor(Math.random() * 200)];

if (!randomDay.date) {
  console.log("No date found for random day");
  process.exit(1);
}

console.log("Random Day:", new Date(randomDay.date).toDateString());
console.log("Year Probabilities --------------------");

for (let i = 4; i < 8; i++) {
  const year = startYear + i;
  const probability = randomDay.years[i];
  console.log(`${year}: ${probability}`);
}
console.log(`${startYear + 6}...2199`);

// Kalshi represents percentage change (0-100) that AI
// passes difficult turing test before 2030,
// Creating sets 2024-2029 and 2030-2199
const kalshiIndex = getNearestKalshiIndex(randomDay.date, kalshi);
if (kalshiIndex === -1) {
  console.log("No kalshi data found for this date");
  process.exit(1);
}

const kalshiValue = kalshi[kalshiIndex];
console.log(`\nAI passes turing before 2030: ${kalshiValue.value}%`);

const probabilityBefore2030 = randomDay.years
  .slice(0, 6)
  .reduce((acc, curr) => acc + curr, 0);

const probabilityAfter2030 = randomDay.years
  .slice(6)
  .reduce((acc, curr) => acc + curr, 0);

console.log(`\nOriginal sums:`);
console.log(`Before 2030: ${probabilityBefore2030}`);
console.log(`After 2030: ${probabilityAfter2030}`);

const kalshiProbability = kalshiValue.value / 100;
const scalingFactorBefore = kalshiProbability / probabilityBefore2030;
const scalingFactorAfter = (1 - kalshiProbability) / probabilityAfter2030;

console.log(`\nAdjusted to match Kalshi probability of ${kalshiProbability}:`);
console.log("Individual year probabilities:");

const adjustedYears = randomDay.years.map((prob, i) => {
  const scalar = i < 6 ? scalingFactorBefore : scalingFactorAfter;
  return prob * scalar;
});

for (let i = 0; i < adjustedYears.length; i++) {
  const year = startYear + i;
  if (i > 3 && i < 8) console.log(`${year}: ${adjustedYears[i]}`);
}
console.log(`${startYear + 6}...2199`);

// Verify sums
const adjustedBefore2030 = adjustedYears.slice(0, 6).reduce((a, b) => a + b, 0);
const adjustedAfter2030 = adjustedYears.slice(6).reduce((a, b) => a + b, 0);
console.log(`\nVerification:`);
console.log(`Sum before 2030: ${adjustedBefore2030}`);
console.log(`Sum after 2030: ${adjustedAfter2030}`);
console.log(`Total: ${adjustedBefore2030 + adjustedAfter2030}`);
