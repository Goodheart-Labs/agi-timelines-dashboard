import { Bet } from "../types";

export async function getManifoldHistoricalData() {
  const contractSlug = "agi-when-resolves-to-the-year-in-wh-d5c5ad8e4708";

  // use /v0/bets, passing contractSlug
  const betsResponse = await fetch(
    `https://api.manifold.markets/v0/bets?contractSlug=${contractSlug}`,
  );
  const bets = (await betsResponse.json()) as { bets: Bet[] };

  console.log({ bets });

  // Example bet
  // const bet = {
  //   betGroupId: "aa458e5fe53d3dd3d6e27775",
  //   id: "2n9fLri7fefK",
  //   fees: {
  //     creatorFee: 0,
  //     platformFee: 0,
  //     liquidityFee: 0,
  //   },
  //   fills: [
  //     {
  //       fees: {
  //         creatorFee: 0,
  //         platformFee: 0,
  //         liquidityFee: 0,
  //       },
  //       amount: 28.828302166827143,
  //       shares: 10629.734305761795,
  //       timestamp: 1728051082479,
  //       matchedBetId: null,
  //     },
  //   ],
  //   isApi: false,
  //   amount: 28.828302166827143,
  //   shares: 10629.734305761795,
  //   userId: "7sqPGamMMvXQcWM9AXvPACYwnXh1",
  //   outcome: "YES",
  //   answerId: "9199140a0c5f",
  //   isFilled: true,
  //   probAfter: 0.002167932510882575,
  //   contractId: "Gtv5mhjKaiLD6Bkvfhcv",
  //   loanAmount: 0,
  //   probBefore: 0.0019205859754004191,
  //   visibility: "public",
  //   createdTime: 1728051082000,
  //   isCancelled: false,
  //   orderAmount: 10000.013095068214,
  //   isRedemption: false,
  //   betId: "2n9fLri7fefK",
  //   updatedTime: 1728051082000,
  // };

  return bets;
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
