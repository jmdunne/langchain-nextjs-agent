import { factCheckData } from "./factChecker";
import { RateLimitManager } from "./rateLimitManager";
import { webScrapingAgent } from "../agents/webScrapingAgent";

export const tools = {
  factChecker: factCheckData,
  rateLimitManager: RateLimitManager,
  webScraper: webScrapingAgent,
} as const;

// Tool types
export type ToolName = keyof typeof tools;
