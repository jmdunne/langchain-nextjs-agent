import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

export async function factCheckData(report: string): Promise<string> {
  const model = new ChatOpenAI({
    temperature: 0.2,
    modelName: "gpt-4",
  });

  const prompt = new PromptTemplate({
    template: `
You are a meticulous fact-checker with expertise in business analysis and competitive research. Your task is to review the following report for potential inaccuracies, inconsistencies, or unsupported claims:

{report}

Please analyze the report and provide feedback on the following:

1. Identify any statements that seem factually incorrect or questionable.
2. Point out any inconsistencies within the report.
3. Highlight claims that lack proper evidence or citation.
4. Suggest areas where additional research or verification might be needed.

For each issue you identify, please provide:
- The specific text or claim in question
- An explanation of why it's problematic
- A suggestion for improvement or verification

After your analysis, provide an overall assessment of the report's accuracy and reliability.

Finally, return the original report with any necessary corrections or annotations clearly marked.
`,
    inputVariables: ["report"],
  });

  const formattedPrompt = await prompt.format({ report });
  const response = await model.invoke(formattedPrompt);
  const factCheckResult = typeof response.content === 'string' 
    ? response.content 
    : Array.isArray(response.content) 
      ? response.content.map(c => typeof c === 'string' ? c : c.type === 'text' ? c.text : '').join('')
      : '';

  // Combine the original report with the fact-check results
  const factCheckedReport = `
Original Report:
----------------
${report}

Fact-Check Results:
-------------------
${factCheckResult}
`;

  return factCheckedReport;
}
