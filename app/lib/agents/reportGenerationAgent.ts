import { PromptTemplate } from "@langchain/core/prompts";
import { factCheckData } from "../tools/factChecker";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { BaseAgent, ReportGenerationInput, ReportGenerationOutput } from "./types";
import { getModel } from "../config/modelConfig";

const reportGenerationSchema = z.object({
  comparison: z.string().describe("The comparative analysis"),
  url: z.string().describe("The URL of the product"),
});

export class ReportGenerationAgent extends BaseAgent<
  ReportGenerationInput,
  ReportGenerationOutput,
  typeof reportGenerationSchema
> {
  protected name = "ReportGenerator";
  protected schema = reportGenerationSchema;
  protected tool: DynamicStructuredTool<typeof reportGenerationSchema> = new DynamicStructuredTool({
    name: this.name,
    description: "Generates a comprehensive analysis report",
    schema: this.schema,
    func: async ({ comparison, url }) => {
      const model = getModel(0.7);

      const prompt = new PromptTemplate({
        template: `
You are a seasoned business analyst with a PhD in Business Administration.

Using the following comparative analysis for the product at {url}:

{comparison}

Generate a comprehensive, PhD-level academic report that includes:

1. **Abstract**
   - Summarize the purpose, methodology, findings, and conclusions.
2. **Introduction**
   - Present the background, objectives, and structure of the report.
3. **Literature Review**
   - Discuss relevant theories, models, and prior studies.
4. **Methodology**
   - Explain the methods and frameworks used in the analysis.
5. **Analysis and Findings**
   - Present a detailed analysis using advanced frameworks.
6. **Discussion**
   - Interpret the findings, discuss implications, and consider limitations.
7. **Conclusion**
   - Summarize the key points and suggest areas for future research.
8. **References**
   - Include citations for any external sources or data used.

Ensure the report:

- Adheres to academic standards.
- Includes citations in APA format.
- Demonstrates critical thinking and depth of analysis.
- Is free from plagiarism and follows ethical guidelines.`,
        inputVariables: ["url", "comparison"],
      });

      const formattedPrompt = await prompt.format({ url, comparison });
      const response = await model.invoke(formattedPrompt);
      const result = typeof response.content === 'string' 
        ? response.content 
        : Array.isArray(response.content) 
          ? response.content.map(c => typeof c === 'string' ? c : c.type === 'text' ? c.text : '').join('')
          : '';

      const factCheckedReport = await factCheckData(result);

      return {
        success: true,
        report: factCheckedReport,
      };
    },
  });
}

// Export singleton instance
export const reportGenerationAgent = new ReportGenerationAgent();
