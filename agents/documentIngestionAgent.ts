import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function documentIngestionAgent(
  rawDocumentation: string
): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splitDocuments = await splitter.createDocuments([rawDocumentation]);
  return splitDocuments;
}
