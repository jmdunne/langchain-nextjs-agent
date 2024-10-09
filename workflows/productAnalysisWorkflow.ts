import { RunnableSequence } from "@langchain/core/runnables";
import { webScrapingAgent } from "../agents/webScrapingAgent";
import { documentIngestionAgent } from "../agents/documentIngestionAgent";
import { informationExtractionAgent } from "../agents/informationExtractionAgent";
import { competitiveResearchAgent } from "../agents/competitiveResearchAgent";
import { analysisComparisonAgent } from "../agents/analysisComparisonAgent";
import { reportGenerationAgent } from "../agents/reportGenerationAgent";

export const productAnalysisWorkflow = RunnableSequence.from([
  // Stage 1: Web Scraping
  async ({ productUrl }) => {
    try {
      console.log("Web Scraping stage input:", { productUrl });
      const result = {
        url: productUrl,
        scrapedContent: await webScrapingAgent({ url: productUrl }),
      };
      console.log("Web Scraping stage output:", result);
      return result;
    } catch (error) {
      console.error("Error in Web Scraping stage:", error);
      throw error;
    }
  },
  // Stage 2: Document Ingestion
  async ({ url, scrapedContent }) => ({
    url,
    documents: await documentIngestionAgent({
      rawDocumentation: scrapedContent,
    }),
  }),
  // Stage 3: Information Extraction
  async ({ url, documents }) => ({
    url,
    productInfo: await informationExtractionAgent({ documents, url }),
  }),
  // Stage 4: Competitive Research
  async ({ url, productInfo }) => ({
    url,
    productInfo,
    competitorInfo: await competitiveResearchAgent({ productInfo, url }),
  }),
  // Stage 5: Analysis Comparison
  async ({ url, productInfo, competitorInfo }) => ({
    url,
    comparison: await analysisComparisonAgent({
      productInfo,
      competitorInfo,
      url,
    }),
  }),
  // Stage 6: Report Generation
  async ({ url, comparison }) => ({
    report: await reportGenerationAgent({ comparison, url }),
  }),
]);
