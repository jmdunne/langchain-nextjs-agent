import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { factCheckData } from "../utils/factChecker";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const reportGenerationTool = new DynamicStructuredTool({
  name: "ReportGenerator",
  description: "Generates a comprehensive analysis report",
  schema: z.object({
    comparison: z.string().describe("The comparative analysis"),
    url: z.string().describe("The URL of the product"),
  }),
  func: async ({ comparison, url }) => {
    const model = new ChatOpenAI({
      temperature: 0.7,
      modelName: "gpt-4o-mini",
    });

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

    const chain = prompt.pipe(model);

    const initialReport = await chain.invoke({ url, comparison });
    // Fact-check the initial report
    const factCheckedReport = await factCheckData(initialReport.content as string);

    return factCheckedReport;
  },
});

export const reportGenerationAgent = async (input: {
  comparison: string;
  url: string;
}) => {
  console.log("reportGenerationAgent input:", { comparisonLength: input.comparison.length, url: input.url });
  const result = await reportGenerationTool.invoke(input);
  console.log("reportGenerationAgent output:", { reportLength: result.length });
  return result;
};
