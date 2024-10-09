import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const documentSplitterTool = new DynamicStructuredTool({
  name: "DocumentSplitter",
  description: "Splits a large document into smaller chunks",
  schema: z.object({
    text: z.string().describe("The text to split"),
  }),
  func: async ({ text }) => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 8000,
      chunkOverlap: 2000,
    });
    return await splitter.createDocuments([text]);
  },
});

export const documentIngestionAgent = async (input: {
  rawDocumentation: string;
}) => {
  console.log("documentIngestionAgent input:", { rawDocumentationLength: input.rawDocumentation.length });
  const result = await documentSplitterTool.invoke({ text: input.rawDocumentation });
  console.log("documentIngestionAgent output:", { documentsCount: result.length });
  return result;
};
