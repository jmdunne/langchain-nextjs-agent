import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const competitiveResearchTool = new DynamicStructuredTool({
  name: "CompetitiveResearcher",
  description: "Performs competitive research based on product information",
  schema: z.object({
    productInfo: z.string().describe("Information about the product"),
    url: z.string().describe("URL of the product"),
  }),
  func: async ({ productInfo, url }) => {
    const model = new ChatOpenAI({
      temperature: 0.7,
      modelName: "gpt-4o-mini",
    });

    const prompt = PromptTemplate.fromTemplate(`
You are a seasoned market research analyst. Analyze the following product information for {url}:

{productInfo}

Provide detailed information about the main competitors and their similar products. For each competitor, include:

- Competitor Name
- Product Name
- Product Description (brief)
- Key Features and Benefits (list top 3-5)
- Pricing (if available)
- Estimated Market Share
- Main Strengths
- Main Weaknesses
- Unique Selling Proposition (USP)

Conclude with a brief summary (2-3 sentences) comparing these competitors to the product in question, highlighting key differentiators.

Limit your response to the most relevant information to keep it concise.
    `);

    const chain = prompt.pipe(model);

    let retries = MAX_RETRIES;
    let backoff = INITIAL_BACKOFF;

    while (retries > 0) {
      try {
        const result = await chain.invoke({ url, productInfo });
        return result.content as string;
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "rate_limit_exceeded" &&
          retries > 0
        ) {
          console.log(
            `Rate limit exceeded. Retrying in ${backoff / 1000} seconds...`
          );
          await delay(backoff);
          retries--;
          backoff *= 2; // Exponential backoff
        } else {
          console.error("Error in competitiveResearchAgent:", error);
          throw error;
        }
      }
    }

    throw new Error(
      "Max retries reached. Unable to complete competitive research."
    );
  },
});

export const competitiveResearchAgent = async (input: {
  productInfo: string;
  url: string;
}) => {
  console.log("competitiveResearchAgent input:", { productInfoLength: input.productInfo.length, url: input.url });
  const result = await competitiveResearchTool.invoke(input);
  console.log("competitiveResearchAgent output:", { competitorInfoLength: result.length });
  return result;
};
