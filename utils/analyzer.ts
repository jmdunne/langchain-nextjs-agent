import { OpenAI } from "@langchain/openai";

export async function analyzeProduct(content: string): Promise<string> {
  const model = new OpenAI({ temperature: 0.7 });

  const prompt = `
    Analyze the following product information and provide a competitive analysis report:
    
    ${content}
    
    Include the following in your analysis:
    1. Brief product description
    2. Key features and benefits
    3. Target audience
    4. Potential competitors
    5. Strengths and weaknesses compared to competitors
    6. Market positioning
    7. Recommendations for improvement
  `;

  const report = await model.call(prompt);
  return report;
}
