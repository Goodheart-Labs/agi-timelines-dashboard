import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello from manifold grouped history!" });
}

/*
Let's take some notes about what we see in the manifold-grouped response.
Each of our bars is in an array called "answers".
We're interested in historical changes of the probability of each answer.
An answer may be referred to as such in the api or as something else,
but some of it's identifying fields are
contractId, prob, totalLiquidity.
Interestingly, there is also a probChanges field, which is an object with
day, week, and month keys. So clearly the historical data is stored on their side.

Many people think we'll get AGI in 2025.
The id of that answer is ed73a628dbcc.
It lives in the contract Gtv5mhjKaiLD6Bkvfhcv.

There is an endpoint for answer probabilities for a given market but it's not historical.

It doesn't seem like we can get 
*/
