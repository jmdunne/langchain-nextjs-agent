import { OpenAI } from "@langchain/openai";

export async function analysisComparisonAgent(
  productInfo: string,
  competitorInfo: string
): Promise<string> {
  const model = new OpenAI({ temperature: 0.2 });

  const comparison = await model.call(
    `Compare the following product information with the competitor information and provide an analysis:
    Product Information: ${productInfo}
    Competitor Information: ${competitorInfo}`
  );

  return comparison;
}
