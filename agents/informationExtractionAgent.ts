import { OpenAI } from "@langchain/openai";
import { Document } from "langchain/document";

export async function informationExtractionAgent(
  documents: Document[]
): Promise<string> {
  const model = new OpenAI({ temperature: 0 });

  const extractedInfo = await model.call(
    `Extract key product information from the following documents: ${documents
      .map((doc) => doc.pageContent)
      .join("\n\n")}`
  );

  return extractedInfo;
}
