import { PromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { BaseAgent, InformationExtractionInput, InformationExtractionOutput } from "./types";
import { getModel } from "../config/modelConfig";
import { RateLimitManager } from "../tools/rateLimitManager";

const informationExtractionSchema = z.object({
  documents: z.array(z.object({ pageContent: z.string() }))
    .describe("The documents to extract information from"),
  url: z.string().describe("The URL of the product"),
});

export class InformationExtractionAgent extends BaseAgent<
  InformationExtractionInput,
  InformationExtractionOutput,
  typeof informationExtractionSchema
> {
  protected name = "InformationExtractor";
  protected schema = informationExtractionSchema;
  protected tool: DynamicStructuredTool<typeof informationExtractionSchema> = new DynamicStructuredTool({
    name: this.name,
    description: "Extracts key product information from documents",
    schema: this.schema,
    func: async ({ documents, url }) => {
      const model = getModel(0);
      const prompt = new PromptTemplate({
        template: `
You are an expert product analyst. Based on the following documents scraped from {url}, extract key product information.

Documents:
{documents}

Provide the extracted information in the following format:

- **Product Name**:
- **Product Description**:
- **Key Features and Benefits**:
- **Price**:
- **Target Audience**:
- **Unique Selling Proposition (USP)**:
- **Additional Notes**:

Be thorough and detailed in your extraction.`,
        inputVariables: ["url", "documents"],
      });

      const formattedPrompt = await prompt.format({
        url,
        documents: documents.map((doc) => doc.pageContent).join("\n\n"),
      });
      const response = await model.invoke(formattedPrompt);
      const result = typeof response.content === 'string' 
        ? response.content 
        : Array.isArray(response.content) 
          ? response.content.map(c => typeof c === 'string' ? c : c.type === 'text' ? c.text : '').join('')
          : '';

      const manager = RateLimitManager.getInstance();
      const extractedInfo = await manager.execute(
        async () => result,
        { maxRetries: 6, initialBackoff: 1000, maxBackoff: 60000 }
      );

      return {
        success: true,
        productInfo: extractedInfo,
      };
    },
  });
}

// Export singleton instance
export const informationExtractionAgent = new InformationExtractionAgent();
