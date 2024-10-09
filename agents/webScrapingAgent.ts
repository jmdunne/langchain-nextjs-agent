import axios from "axios";
import * as cheerio from "cheerio";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const webScrapingTool = new DynamicStructuredTool({
  name: "WebScraper",
  description: "Scrapes content from a given URL",
  schema: z.object({
    url: z.string().describe("The URL to scrape"),
  }),
  func: async ({ url }) => {
    try {
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      $("script, style").remove();
      const text = $("body").text();
      return text.replace(/\s+/g, " ").trim();
    } catch (error) {
      throw new Error(
        `Failed to scrape the webpage: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const webScrapingAgent = async (input: { url: string }) => {
  try {
    console.log("webScrapingAgent input:", input);
    const result = await webScrapingTool.invoke(input);
    console.log("webScrapingAgent output:", result);
    return result;
  } catch (error) {
    console.error("Error in webScrapingAgent:", error);
    throw error;
  }
};
