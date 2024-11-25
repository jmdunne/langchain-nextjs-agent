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
      const result = await webScrapingAgent.execute({ url: productUrl });
      
      if (!result.success || !result.content) {
        throw new Error(result.error || 'Web scraping failed to return content');
      }
      
      console.log("Web Scraping stage output:", result);
      return {
        url: productUrl,
        scrapedContent: result.content,
      };
    } catch (error) {
      console.error("Error in Web Scraping stage:", error);
      throw new Error(`Web scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  // Stage 2: Document Ingestion
  async ({ url, scrapedContent }) => {
    if (!scrapedContent) {
      throw new Error('No content available for document ingestion');
    }
    
    const result = await documentIngestionAgent.execute({
      url,
      rawDocumentation: scrapedContent,
    });
    
    if (!result.success || !result.documents) {
      throw new Error(result.error || 'Document ingestion failed');
    }
    
    return {
      url,
      documents: result.documents,
    };
  },
  // Stage 3: Information Extraction
  async ({ url, documents }) => {
    const result = await informationExtractionAgent.execute({ documents, url });
    return {
      url,
      productInfo: result.productInfo,
    };
  },
  // Stage 4: Competitive Research
  async ({ url, productInfo }) => {
    const result = await competitiveResearchAgent.execute({ productInfo, url });
    return {
      url,
      productInfo,
      competitorInfo: result.competitorInfo,
    };
  },
  // Stage 5: Analysis Comparison
  async ({ url, productInfo, competitorInfo }) => {
    const result = await analysisComparisonAgent.execute({
      productInfo,
      competitorInfo,
      url,
    });
    return {
      url,
      comparison: result.comparison,
    };
  },
  // Stage 6: Report Generation
  async ({ url, comparison }) => {
    const result = await reportGenerationAgent.execute({ comparison, url });
    return {
      report: result.report,
    };
  },
]);
