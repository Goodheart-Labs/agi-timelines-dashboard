import { NextResponse } from "next/server";
import tmp from "tmp";
import fs from "fs";
import path from "path";
import extract from "extract-zip";
import Papa from "papaparse";
import { MetaculusResponse } from "@/lib/types";

const METACULUS_API = "https://www.metaculus.com/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json(
      { error: "questionId is required" },
      { status: 400 },
    );
  }

  if (!process.env.METACULUS_API_KEY) {
    return NextResponse.json(
      { error: "METACULUS_API_KEY not set" },
      { status: 500 },
    );
  }

  try {
    // Create temp directory
    const tmpDir = tmp.dirSync();
    const zipPath = path.join(tmpDir.name, `metaculus-${questionId}.zip`);

    // Download data
    const params = new URLSearchParams({
      aggregation_methods: "recency_weighted",
      minimize: "true",
      include_comments: "false",
    });

    const url = `${METACULUS_API}/posts/${questionId}/download-data/?${params}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${process.env.METACULUS_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    // Save zip file
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(zipPath, buffer);

    // Extract zip
    await extract(zipPath, { dir: tmpDir.name });

    // Read and parse the files
    const forecastData = Papa.parse(
      fs.readFileSync(path.join(tmpDir.name, "forecast_data.csv"), "utf8"),
      { header: true },
    ).data as { "Question ID": string }[];

    // Fetch question data from metaculus
    const questionData = await fetch(`${METACULUS_API}/posts/${questionId}/`, {
      headers: { Authorization: `Token ${process.env.METACULUS_API_KEY}` },
    });

    const questionDataJson = (await questionData.json()) as {
      question: MetaculusResponse;
    };

    // Cleanup
    fs.rmSync(tmpDir.name, { recursive: true, force: true });

    return NextResponse.json(
      {
        forecast: forecastData
          // Filter out empty rows
          .filter((row: { "Question ID": string }) => row["Question ID"]),
        question: questionDataJson.question,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process Metaculus data",
      },
      { status: 500 },
    );
  }
}
