import { NextRequest } from "next/server";
import { productAnalysisWorkflow } from "../../lib/workflows/productAnalysisWorkflow";
import { reportGenerationAgent } from "../../lib/agents/reportGenerationAgent";
import { documentIngestionAgent } from "../../lib/agents/documentIngestionAgent";
import { webScrapingAgent } from "../../lib/agents/webScrapingAgent";
import { informationExtractionAgent } from "../../lib/agents/informationExtractionAgent";
import { competitiveResearchAgent } from "../../lib/agents/competitiveResearchAgent";
import { analysisComparisonAgent } from "../../lib/agents/analysisComparisonAgent";

interface StageUpdate {
  stage: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response(
      JSON.stringify({ 
        stage: "error", 
        message: "Product URL is required" 
      }), 
      { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (update: StageUpdate) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
        );
      };

      try {
        const result = await productAnalysisWorkflow.invoke(
          {
            productUrl: url,
            additionalInfo: "",
            agents: {
              webScrapingAgent,
              documentIngestionAgent,
              informationExtractionAgent,
              competitiveResearchAgent,
              analysisComparisonAgent,
              reportGenerationAgent,
            },
          }
        );

        if (!result || !result.report) {
          throw new Error('Analysis failed to generate a report');
        }

        sendUpdate({
          stage: "complete",
          message: result.report,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error in product analysis:", error);
        sendUpdate({
          stage: "error",
          message: error instanceof Error 
            ? error.message 
            : "An unexpected error occurred during the analysis",
          timestamp: new Date().toISOString()
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
