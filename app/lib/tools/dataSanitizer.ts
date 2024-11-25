import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

const dataSanitizerSchema = z.object({
  content: z.string().describe("The content to sanitize"),
  type: z.enum(["html", "text", "markdown"]).describe("The type of content"),
});

export const dataSanitizerTool = new DynamicStructuredTool({
  name: "DataSanitizer",
  description: "Sanitizes and cleans input data",
  schema: dataSanitizerSchema,
  func: async ({ content, type }) => {
    try {
      let sanitized = '';
      
      switch (type) {
        case "html":
          sanitized = purify.sanitize(content);
          break;
        case "text":
          sanitized = content
            .replace(/[^\w\s-.,?!]/g, "")
            .replace(/\s+/g, " ")
            .trim();
          break;
        case "markdown":
          sanitized = content
            .replace(/[^\w\s-.,?!#*`]/g, "")
            .replace(/\s+/g, " ")
            .trim();
          break;
        default:
          throw new Error("Unsupported content type");
      }

      // Only return success: false if sanitized content is empty
      if (!sanitized) {
        return {
          success: false,
          error: "Sanitization resulted in empty content",
          sanitized: null,
        };
      }

      return {
        success: true,
        sanitized,
        type,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown sanitization error",
        sanitized: null,
      };
    }
  },
}); 