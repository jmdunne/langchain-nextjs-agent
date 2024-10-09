import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { Document } from "langchain/document";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const extractInfoTool = new DynamicStructuredTool({
  name: "InformationExtractor",
  description: "Extracts key product information from documents",
  schema: z.object({
    documents: z.array(z.object({ pageContent: z.string() })).describe("The documents to extract information from"),
    url: z.string().describe("The URL of the product"),
  }),
  func: async ({ documents, url }) => {
    const model = new ChatOpenAI({
      temperature: 0,
      modelName: "gpt-4o-mini",
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
  },
});

export const informationExtractionAgent = async (input: {
  documents: Document[];
  url: string;
}) => {
  console.log("informationExtractionAgent input:", { documentsCount: input.documents.length, url: input.url });
  const result = await extractInfoTool.invoke(input);
  console.log("informationExtractionAgent output:", { productInfoLength: result.length });
  return result;
};
