import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const rateLimitSchema = z.object({
  operation: z.function().describe("The operation being rate limited"),
  maxRetries: z.number().default(6),
  initialBackoff: z.number().default(1000),
  maxBackoff: z.number().default(60000), // 60 seconds
  modelName: z.string().optional(),
});

interface RateLimitOptions {
  maxRetries: number;
  initialBackoff: number;
  maxBackoff: number;
}

interface RateLimitError {
  response?: {
    status?: number;
    headers?: {
      [key: string]: string;
    };
  };
  code?: string;
  message?: string;
}

interface ApiError extends Error {
  response?: {
    headers: {
      "retry-after"?: string;
    };
  };
}

export class RateLimitManager {
  private static instance: RateLimitManager;
  private requestCounts: Map<string, number> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private domainRequests: Map<string, { count: number; lastReset: number }> =
    new Map();
  private readonly requestsPerMinute = 60;

  private constructor() {}

  static getInstance(): RateLimitManager {
    if (!RateLimitManager.instance) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateBackoff(
    attempt: number,
    initialBackoff: number,
    maxBackoff: number
  ): number {
    const backoff = initialBackoff * Math.pow(2, attempt);
    return Math.min(backoff, maxBackoff);
  }

  private isRateLimitError(error: unknown): error is RateLimitError {
    if (!error || typeof error !== "object") return false;
    const err = error as RateLimitError;
    return (
      err.response?.status === 429 ||
      err.code === "rate_limit_exceeded" ||
      (typeof err.message === "string" &&
        err.message.toLowerCase().includes("rate limit"))
    );
  }

  private async checkDomainRateLimit(url: string): Promise<void> {
    const domain = new URL(url).hostname;
    const now = Date.now();
    const domainState = this.domainRequests.get(domain) || {
      count: 0,
      lastReset: now,
    };

    if (now - domainState.lastReset > 60000) {
      // Reset if more than a minute has passed
      this.domainRequests.set(domain, { count: 1, lastReset: now });
      return;
    }

    if (domainState.count >= this.requestsPerMinute) {
      const waitTime = 60000 - (now - domainState.lastReset);
      await this.delay(waitTime);
      this.domainRequests.set(domain, { count: 1, lastReset: now });
      return;
    }

    this.domainRequests.set(domain, {
      count: domainState.count + 1,
      lastReset: domainState.lastReset,
    });
  }

  async execute<T>(
    operation: () => Promise<T>,
    options: RateLimitOptions = {
      maxRetries: 6,
      initialBackoff: 1000,
      maxBackoff: 60000,
    }
  ): Promise<T> {
    let attempt = 0;

    while (attempt <= options.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        if (this.isRateLimitError(error) && attempt < options.maxRetries) {
          const backoff = this.calculateBackoff(
            attempt,
            options.initialBackoff,
            options.maxBackoff
          );

          console.warn(
            `Rate limit hit for operation. Attempt ${attempt + 1}/${
              options.maxRetries
            }. Waiting ${backoff / 1000} seconds...`
          );

          await this.delay(backoff);
          attempt++;
          continue;
        }
        throw error;
      }
    }
    throw new Error(`Rate limit exceeded after ${options.maxRetries} retries`);
  }
}
export const rateLimitManagerTool = new DynamicStructuredTool({
  name: "RateLimitManager",
  description: "Manages rate limiting and retries for API calls",
  schema: rateLimitSchema,
  func: async ({ operation, maxRetries, initialBackoff, maxBackoff }) => {
    const manager = RateLimitManager.getInstance();

    try {
      await manager.execute(
        async () => {
          // Execute the actual operation passed as parameter
          await operation();
          return true;
        },
        { maxRetries, initialBackoff, maxBackoff }
      );

      return {
        success: true,
        message: `Operation completed successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Rate limit error occurred",
        retryAfter: (error as ApiError).response?.headers?.["retry-after"],
      };
    }
  },
});
