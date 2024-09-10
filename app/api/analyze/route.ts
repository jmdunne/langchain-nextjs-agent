import { NextResponse } from "next/server";
import { scrapeWebpage } from "../../../utils/scraper";
import { documentIngestionAgent } from "../../../agents/documentIngestionAgent";
import { informationExtractionAgent } from "../../../agents/informationExtractionAgent";
import { competitiveResearchAgent } from "../../../agents/competitiveResearchAgent";
import { analysisComparisonAgent } from "../../../agents/analysisComparisonAgent";
import { reportGenerationAgent } from "../../../agents/reportGenerationAgent";

export async function POST(req: Request) {
  const { url } = await req.json();

  try {
    const scrapedContent = await scrapeWebpage(url);
    const documents = await documentIngestionAgent(scrapedContent);
    const extractedInfo = await informationExtractionAgent(documents);
    const competitorInfo = await competitiveResearchAgent(extractedInfo);
    const comparison = await analysisComparisonAgent(extractedInfo, competitorInfo);
    const report = await reportGenerationAgent(comparison);

    return NextResponse.json({ report });
  } catch (error: unknown) {
    console.error("Error in analysis:", error);
    if (error instanceof Error && (error.message.includes("429") || error.message.includes("quota"))) {
      return NextResponse.json({ error: "Service is temporarily unavailable due to high demand. Please try again later." }, { status: 503 });
    }
    return NextResponse.json({ error: "An error occurred during analysis" }, { status: 500 });
  }
}
