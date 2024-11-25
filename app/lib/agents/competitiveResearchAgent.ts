import { DynamicStructuredTool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import {
  BaseAgent,
  CompetitiveResearchInput,
  CompetitiveResearchOutput,
} from "./types";
import { getModel } from "../config/modelConfig";
import { tools } from "../tools";
import { RateLimitManager } from "../tools/rateLimitManager";

const competitiveResearchSchema = z.object({
  productInfo: z.string().describe("Information about the product"),
  url: z.string().describe("URL of the product"),
});

export class CompetitiveResearchAgent extends BaseAgent<
  CompetitiveResearchInput,
  CompetitiveResearchOutput,
  typeof competitiveResearchSchema
> {
  protected name = "CompetitiveResearcher";
  protected schema = competitiveResearchSchema;
  protected tool: DynamicStructuredTool<typeof competitiveResearchSchema> =
    new DynamicStructuredTool({
      name: this.name,
      description: "Performs competitive research based on product information",
      schema: this.schema,
      func: async ({ productInfo, url }) => {
        // Use scraper to get more detailed information
        const scraperResults = await tools.webScraper.execute({ url });

        // Analyze the information
        const model = getModel(0.7);
        const prompt = PromptTemplate.fromTemplate(`
        Analyze the following information:

        Product Information:
        ${productInfo}

        Additional Context:
        ${scraperResults}

        Provide a detailed competitive analysis following the standard format.
      `);

        const formattedPrompt = await prompt.format({ url, productInfo });
        const response = await model.invoke(formattedPrompt);
        const result =
          typeof response.content === "string"
            ? response.content
            : Array.isArray(response.content)
            ? response.content
                .map((c) =>
                  typeof c === "string" ? c : c.type === "text" ? c.text : ""
                )
                .join("")
            : "";

        const manager = RateLimitManager.getInstance();
        const finalResult = await manager.execute(async () => Promise.resolve(result), {
          maxRetries: 6,
          initialBackoff: 1000,
          maxBackoff: 60000,
        });

        return {
          success: true,
          competitorInfo: finalResult,
        };
      },
    });
}

// Export singleton instance
export const competitiveResearchAgent = new CompetitiveResearchAgent();
