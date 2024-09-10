import { OpenAI } from "@langchain/openai";

export async function reportGenerationAgent(
  comparison: string
): Promise<string> {
  const model = new OpenAI({ temperature: 0.5 });

  const report = await model.call(
    `Generate a comprehensive report based on the following product and competitor comparison: ${comparison}`
  );

  return report;
}
