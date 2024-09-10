import { OpenAI } from "@langchain/openai";

export async function competitiveResearchAgent(
  productInfo: string
): Promise<string> {
  const model = new OpenAI({ temperature: 0.2 });

  const competitorInfo = await model.call(
    `Based on this product information, research and provide information about main competitors and their similar products: ${productInfo}`
  );

  return competitorInfo;
}
