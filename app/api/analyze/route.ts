import { NextRequest } from "next/server";
import { scrapeWebpage } from "../../../utils/scraper";
import { documentIngestionAgent } from "../../../agents/documentIngestionAgent";
import { informationExtractionAgent } from "../../../agents/informationExtractionAgent";
import { competitiveResearchAgent } from "../../../agents/competitiveResearchAgent";
import { analysisComparisonAgent } from "../../../agents/analysisComparisonAgent";
import { reportGenerationAgent } from "../../../agents/reportGenerationAgent";

export const runtime = 'edge'; // Enable Edge Runtime for SSE support

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Stage 1: Web Scraping
        sendEvent('stage', { stage: 'Web Scraping' });
        const scrapedContent = await scrapeWebpage(url);

        // Stage 2: Document Ingestion
        sendEvent('stage', { stage: 'Document Ingestion' });
        const documents = await documentIngestionAgent(scrapedContent);

        // Stage 3: Information Extraction
        sendEvent('stage', { stage: 'Information Extraction' });
        const extractedInfo = await informationExtractionAgent(documents, url);

        // Stage 4: Competitive Research
        sendEvent('stage', { stage: 'Competitive Research' });
        const competitorInfo = await competitiveResearchAgent(extractedInfo, url);

        // Stage 5: Analysis Comparison
        sendEvent('stage', { stage: 'Analysis Comparison' });
        const comparison = await analysisComparisonAgent(extractedInfo, competitorInfo, url);

        // Stage 6: Report Generation
        sendEvent('stage', { stage: 'Report Generation' });
        const report = await reportGenerationAgent(comparison, url);

        // Complete
        sendEvent('complete', { report });
        controller.close();
      } catch (error: unknown) {
        console.error("Error in analysis:", error);
        sendEvent('error', { message: 'An error occurred during analysis' });
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no', // For nginx
    },
  });
}
