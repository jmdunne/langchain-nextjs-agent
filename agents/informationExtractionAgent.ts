import { ChatOpenAI } from "@langchain/openai";
import { Document } from "langchain/document";
import { PromptTemplate } from "@langchain/core/prompts";

export async function informationExtractionAgent(
  documents: Document[],
  url: string
): Promise<string> {
  const model = new ChatOpenAI({
    temperature: 0, // Low temperature for consistency
    modelName: "gpt-4",
  });

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

  const chain = prompt.pipe(model);

  const extractedInfo = await chain.invoke({
    url,
    documents: documents.map((doc) => doc.pageContent).join("\n\n"),
  });

  return extractedInfo.content as string;
}
