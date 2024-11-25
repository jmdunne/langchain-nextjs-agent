import { PromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  BaseAgent,
  AnalysisComparisonInput,
  AnalysisComparisonOutput,
} from "./types";
import { getModel } from "../config/modelConfig";
import { factCheckData } from "../tools/factChecker";

const analysisComparisonSchema = z.object({
  productInfo: z.string().describe("Information about the product"),
  competitorInfo: z.string().describe("Information about competitors"),
  url: z.string().describe("URL of the product"),
});

export class AnalysisComparisonAgent extends BaseAgent<
  AnalysisComparisonInput,
  AnalysisComparisonOutput,
  typeof analysisComparisonSchema
> {
  protected name = "AnalysisComparison";
  protected schema = analysisComparisonSchema;
  protected tool: DynamicStructuredTool<typeof analysisComparisonSchema> =
    new DynamicStructuredTool({
      name: this.name,
      description:
        "Performs a comprehensive comparative analysis of a product against its competitors",
      schema: this.schema,
      func: async ({ productInfo, competitorInfo, url }) => {
        const model = getModel(0.6);
        const prompt = PromptTemplate.fromTemplate(`
You are an expert business analyst.

Using the following information:

**Product Information from {url}:**

{productInfo}

**Competitor Information:**

{competitorInfo}

Perform a comprehensive comparative analysis covering:

1. **Feature Comparison**:
   - Compare product features in detail.
2. **Pricing Strategies**:
   - Analyze pricing models and value for money.
3. **Market Positioning**:
   - Discuss branding, target markets, and positioning.
4. **Strengths and Weaknesses**:
   - Evaluate the pros and cons relative to competitors.
5. **Customer Perception**:
   - Consider reviews, ratings, and overall market sentiment.

Conclude with insights on how the product can improve its competitive advantage.`);

        const formattedPrompt = await prompt.format({
          productInfo,
          competitorInfo,
          url,
        });
        
        const response = await model.invoke(formattedPrompt);
        const comparison = typeof response.content === 'string' 
          ? response.content 
          : Array.isArray(response.content) 
            ? response.content.map(c => typeof c === 'string' ? c : c.type === 'text' ? c.text : '').join('')
            : '';

        // Fact check the comparison
        const factCheckedComparison = await factCheckData(comparison);

        return {
          success: true,
          comparison: factCheckedComparison,
        };
      },
    });
}

// Export singleton instance
export const analysisComparisonAgent = new AnalysisComparisonAgent();
