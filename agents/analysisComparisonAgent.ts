import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const analysisComparisonTool = new DynamicStructuredTool({
  name: "AnalysisComparison",
  description: "Performs a comprehensive comparative analysis of a product against its competitors",
  schema: z.object({
    productInfo: z.string().describe("Information about the product"),
    competitorInfo: z.string().describe("Information about competitors"),
    url: z.string().describe("URL of the product"),
  }),
  func: async ({ productInfo, competitorInfo, url }) => {
    const analysisComparisonChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(`
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

Conclude with insights on how the product can improve its competitive advantage.`),
      new ChatOpenAI({
        temperature: 0.6,
        modelName: "gpt-4o-mini",
      }),
      new StringOutputParser(),
    ]);

    return await analysisComparisonChain.invoke({ productInfo, competitorInfo, url });
  },
});

export const analysisComparisonAgent = async (input: {
  productInfo: string;
  competitorInfo: string;
  url: string;
}) => {
  console.log("analysisComparisonAgent input:", {
    productInfoLength: input.productInfo.length,
    competitorInfoLength: input.competitorInfo.length,
    url: input.url
  });
  const result = await analysisComparisonTool.invoke(input);
  console.log("analysisComparisonAgent output:", { comparisonLength: result.length });
  return result;
};
