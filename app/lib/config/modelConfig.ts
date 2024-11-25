import { ChatOpenAI } from "@langchain/openai";

export const getModel = (temperature = 0.7) => new ChatOpenAI({
  temperature,
  modelName: process.env.OPENAI_MODEL_NAME || "gpt-4o-mini",
  maxRetries: 3,
  maxConcurrency: 5,
}); 