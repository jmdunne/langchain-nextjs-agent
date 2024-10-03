import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

export async function competitiveResearchAgent(
  productInfo: string,
  url: string
): Promise<string> {
  const model = new ChatOpenAI({
    temperature: 0.7, // Higher temperature for creativity
    modelName: "gpt-4",
  });

  const prompt = new PromptTemplate({
    template: `
You are a seasoned market research analyst.

Based on the product information below for the product at {url}:

{productInfo}

Research and provide detailed information about the main competitors and their similar products. For each competitor, include:

- **Competitor Name**:
- **Product Name**:
- **Product Description**:
- **Key Features and Benefits**:
- **Pricing**:
- **Market Share**:
- **Strengths and Weaknesses**:
- **Unique Selling Proposition (USP)**:

Conclude with a summary comparing these competitors to the product in question, highlighting areas where the product stands out or falls short.`,
    inputVariables: ["url", "productInfo"],
  });

  const chain = prompt.pipe(model);

  const competitorInfo = await chain.invoke({ url, productInfo });

  return competitorInfo.content as string;
}
