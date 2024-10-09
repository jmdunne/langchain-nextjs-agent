import { NextRequest } from "next/server";
import { productAnalysisWorkflow } from "../../../workflows/productAnalysisWorkflow";
import { reportGenerationAgent } from "../../../agents/reportGenerationAgent";
import { documentIngestionAgent } from "../../../agents/documentIngestionAgent";
import { webScrapingAgent } from "../../../agents/webScrapingAgent";
import { informationExtractionAgent } from "../../../agents/informationExtractionAgent";
import { competitiveResearchAgent } from "../../../agents/competitiveResearchAgent";
import { analysisComparisonAgent } from "../../../agents/analysisComparisonAgent";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: "Product URL is required" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (stage: string, message: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage, message })}\n\n`));
      };

      try {
        const result = await productAnalysisWorkflow.invoke({
          productUrl: url,
          additionalInfo: '',
          agents: {
            documentIngestionAgent,
            webScrapingAgent,
            informationExtractionAgent,
            competitiveResearchAgent,
            analysisComparisonAgent,
            reportGenerationAgent,
          },
        }, {
          callbacks: [
            {
              handleLLMNewToken: (token) => sendUpdate('processing', token),
            },
          ],
        });

        sendUpdate('complete', result.report);
      } catch (error) {
        console.error("Error in product analysis:", error);
        sendUpdate('error', 'An error occurred during the analysis');
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
