import { Bet } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "No contract slug provided" },
      { status: 400 },
    );
  }

  // Fetch all bets for the contract, by fetching using ?before with the oldest bet id
  const bets: Bet[] = [];
  let hasMore = true;
  let cursor = "";
  while (hasMore) {
    const searchParams = new URLSearchParams();
    searchParams.set("contractSlug", slug);
    if (cursor) {
      searchParams.set("before", cursor);
    }
    const betsResponse = await fetch(
      `https://api.manifold.markets/v0/bets?${searchParams.toString()}`,
    );
    const newBets = (await betsResponse.json()) as Bet[];
    bets.push(...newBets);

    if (newBets.length === 0) {
      hasMore = false;
    } else {
      cursor = newBets[newBets.length - 1].id;
    }
  }

  // Cache for 1 hour
  const cache = new Response(JSON.stringify({ bets }), {
    headers: { "Cache-Control": "public, max-age=3600" },
  });

  return cache;
}
