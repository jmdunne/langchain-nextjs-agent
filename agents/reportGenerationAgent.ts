import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

export async function reportGenerationAgent(
  comparison: string,
  url: string
): Promise<string> {
  const model = new ChatOpenAI({
    temperature: 0.7,
    modelName: "gpt-4",
  });

  const prompt = new PromptTemplate({
    template: `
You are a professional business analyst and report writer.

Based on the comparative analysis below for the product at {url}:

{comparison}

Generate a comprehensive report including:

1. **Executive Summary**
2. **Introduction**
3. **Product Overview**
4. **Competitive Landscape**
5. **Comparative Analysis**
6. **SWOT Analysis**
7. **Recommendations**
8. **Conclusion**

Ensure the report:

- Is well-structured and formatted.
- Uses professional and clear language.
- Provides actionable insights.
- Includes data and examples where appropriate.

Do not include any irrelevant information. Focus on delivering value to stakeholders.`,
    inputVariables: ["url", "comparison"],
  });

  const chain = prompt.pipe(model);

  const report = await chain.invoke({ url, comparison });

  return report.content as string;
}
