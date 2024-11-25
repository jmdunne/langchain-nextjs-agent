import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { Document } from "langchain/document";

// Base input/output types
export interface BaseAgentInput {
  url: string;
}

export interface BaseAgentOutput {
  success: boolean;
  error?: string;
}

// Specific agent input/output types
export interface WebScrapingInput extends BaseAgentInput {}
export interface WebScrapingOutput extends BaseAgentOutput {
  content: string;
}

export interface DocumentIngestionInput extends BaseAgentInput {
  rawDocumentation: string;
}
export interface DocumentIngestionOutput extends BaseAgentOutput {
  documents: Document[];
}

export interface InformationExtractionInput extends BaseAgentInput {
  documents: Document[];
}
export interface InformationExtractionOutput extends BaseAgentOutput {
  productInfo: string;
}

export interface CompetitiveResearchInput extends BaseAgentInput {
  productInfo: string;
}
export interface CompetitiveResearchOutput extends BaseAgentOutput {
  competitorInfo: string;
}

export interface AnalysisComparisonInput extends BaseAgentInput {
  productInfo: string;
  competitorInfo: string;
}
export interface AnalysisComparisonOutput extends BaseAgentOutput {
  comparison: string;
}

export interface ReportGenerationInput extends BaseAgentInput {
  comparison: string;
}
export interface ReportGenerationOutput extends BaseAgentOutput {
  report: string;
}

// Base agent type
export abstract class BaseAgent<
  TInput extends BaseAgentInput, 
  TOutput extends BaseAgentOutput,
  TSchema extends z.ZodType = z.ZodType
> {
  protected abstract name: string;
  protected abstract schema: TSchema;
  protected abstract tool: DynamicStructuredTool<TSchema>;

  async execute(input: TInput): Promise<TOutput> {
    try {
      // Validate input against schema
      this.schema.parse(input);
      
      console.log(`${this.constructor.name} input:`, input);
      
      // Validate that all required input fields are present
      const inputKeys = Object.keys(input);
      if (inputKeys.length === 0) {
        throw new Error('Empty input provided');
      }
      
      const result = await this.tool.invoke(input);
      console.log(`${this.constructor.name} output:`, result);
      
      // Validate the output
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid output format');
      }
      
      return {
        success: true,
        ...result,
      } as TOutput;
    } catch (error) {
      console.error(`Error in ${this.constructor.name}:`, error);
      
      // Improve error message formatting
      const errorMessage = error instanceof Error 
        ? error.message
        : error instanceof z.ZodError 
          ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          : 'Unknown error occurred';
          
      return {
        success: false,
        error: errorMessage,
      } as TOutput;
    }
  }
} 