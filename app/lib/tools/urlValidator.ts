import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

const urlValidatorSchema = z.object({
  url: z.string().describe("The URL to validate"),
});

export const urlValidatorTool = new DynamicStructuredTool({
  name: "URLValidator",
  description: "Validates and checks accessibility of URLs",
  schema: urlValidatorSchema,
  func: async ({ url }) => {
    try {
      // Check URL format
      new URL(url);
      
      // Check if URL is accessible
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: (status) => status < 400,
      });
      
      return {
        valid: true,
        status: response.status,
        message: "URL is valid and accessible",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          valid: false,
          error: error.message,
          message: "URL validation failed",
        };
      }
      throw error;
    }
  },
}); 