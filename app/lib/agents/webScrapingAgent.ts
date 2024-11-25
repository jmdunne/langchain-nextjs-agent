import axios from "axios";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { BaseAgent, WebScrapingInput, WebScrapingOutput } from "./types";
import { urlValidatorTool } from "../tools/urlValidator";
import { dataSanitizerTool } from "../tools/dataSanitizer";
import { proxyList } from "../config/proxyConfig";
import {
  USER_AGENTS,
  detectAndHandleContentType,
} from "../utils/scrapingUtils";
import { RateLimitManager } from "../tools/rateLimitManager";

const webScrapingSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export class WebScrapingAgent extends BaseAgent<
  WebScrapingInput,
  WebScrapingOutput,
  typeof webScrapingSchema
> {
  protected name = "WebScraper";
  protected schema = webScrapingSchema;
  private currentProxyIndex = 0;
  private currentUserAgentIndex = 0;
  private maxContentLength = 10_000_000; // 10MB limit

  private getNextProxy() {
    if (proxyList.length === 0) return undefined;
    this.currentProxyIndex = (this.currentProxyIndex + 1) % proxyList.length;
    return proxyList[this.currentProxyIndex];
  }

  private getNextUserAgent() {
    this.currentUserAgentIndex =
      (this.currentUserAgentIndex + 1) % USER_AGENTS.length;
    return USER_AGENTS[this.currentUserAgentIndex];
  }

  private getSanitizerType(
    contentType: "html" | "json" | "text"
  ): "html" | "text" {
    return contentType === "json" ? "text" : contentType;
  }

  protected tool: DynamicStructuredTool<typeof webScrapingSchema> =
    new DynamicStructuredTool({
      name: this.name,
      description: "Scrapes content from a given URL",
      schema: this.schema,
      func: async ({ url }) => {
        const validationResult = await urlValidatorTool.invoke({ url });
        if (!validationResult.valid) {
          throw new Error(`Invalid URL: ${validationResult.message}`);
        }

        const manager = RateLimitManager.getInstance();
        return await manager.execute(
          async () => {
            const proxy = this.getNextProxy();
            const userAgent = this.getNextUserAgent();

            const axiosConfig = {
              timeout: 5000,
              validateStatus: (status: number) => status === 200,
              headers: {
                "User-Agent": userAgent,
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                Connection: "keep-alive",
                DNT: "1",
              },
              maxContentLength: this.maxContentLength,
              ...(proxy && {
                proxy: {
                  host: proxy.host,
                  port: proxy.port,
                  auth: proxy.auth,
                },
              }),
            };

            try {
              const response = await axios.get(url, axiosConfig);
              const scrapedContent = await detectAndHandleContentType(response);

              if (!scrapedContent.success) {
                throw new Error(
                  `Content processing failed: ${scrapedContent.error}`
                );
              }

              const sanitizedResult = await dataSanitizerTool.invoke({
                content: scrapedContent.content,
                type: this.getSanitizerType(scrapedContent.contentType),
              });

              if (!sanitizedResult.success || !sanitizedResult.sanitized) {
                throw new Error(
                  `Content sanitization failed: ${sanitizedResult.error || 'No content returned after sanitization'}`
                );
              }

              return {
                success: true,
                content: sanitizedResult.sanitized,
                metadata: {
                  ...scrapedContent.metadata,
                  sanitized: true,
                  originalLength: scrapedContent.content.length,
                  sanitizedLength: sanitizedResult.sanitized.length,
                  originalType: scrapedContent.contentType,
                  sanitizedType: this.getSanitizerType(
                    scrapedContent.contentType
                  ),
                },
              };
            } catch (error) {
              if (axios.isAxiosError(error)) {
                const statusCode = error.response?.status;
                const errorMessage =
                  error.response?.data?.message || error.message;
                throw new Error(
                  `Failed to scrape (${statusCode}): ${errorMessage}`
                );
              }
              throw error;
            }
          },
          { maxRetries: 6, initialBackoff: 1000, maxBackoff: 60000 }
        );
      },
    });
}

// Export singleton instance
export const webScrapingAgent = new WebScrapingAgent();
