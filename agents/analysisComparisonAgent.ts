import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

export async function analysisComparisonAgent(
  productInfo: string,
  competitorInfo: string,
  url: string
): Promise<string> {
  const model = new ChatOpenAI({
    temperature: 0.6,
    modelName: "gpt-4",
  });

  const prompt = new PromptTemplate({
    template: `
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

Conclude with insights on how the product can improve its competitive advantage.`,
    inputVariables: ["url", "productInfo", "competitorInfo"],
  });

  const chain = prompt.pipe(model);

  const comparison = await chain.invoke({ url, productInfo, competitorInfo });

  return comparison.content as string;
}
