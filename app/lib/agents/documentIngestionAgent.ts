import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { BaseAgent, DocumentIngestionInput, DocumentIngestionOutput } from "./types";

const documentIngestionSchema = z.object({
  rawDocumentation: z.string().describe("The text to split"),
  url: z.string().describe("The URL of the product"),
});

export class DocumentIngestionAgent extends BaseAgent<
  DocumentIngestionInput,
  DocumentIngestionOutput,
  typeof documentIngestionSchema
> {
  protected name = "DocumentSplitter";
  protected schema = documentIngestionSchema;
  protected tool: DynamicStructuredTool<typeof documentIngestionSchema> = new DynamicStructuredTool({
    name: this.name,
    description: "Splits a large document into smaller chunks",
    schema: this.schema,
    func: async ({ rawDocumentation }) => {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 8000,
        chunkOverlap: 2000,
      });
      
      const documents = await splitter.createDocuments([rawDocumentation]);
      
      return {
        success: true,
        documents,
      };
    },
  });
}

// Export singleton instance
export const documentIngestionAgent = new DocumentIngestionAgent();
