// src/infrastructure/llm/GeminiClient.ts

import { I_LlmClient } from '@/core/domain/ports';
import { CodeSnippet, DmlAnalysis } from '@/core/domain/models';
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

/**
 * Concrete implementation of I_LlmClient for the Google Gemini API, using the official SDK.
 * This is more robust and handles API complexities like authentication and retries.
 */
export class GeminiClient implements I_LlmClient {
  private readonly genAI: GoogleGenerativeAI;
  private readonly generationConfig: GenerationConfig;

  constructor(
    private readonly apiKey: string,
    private readonly modelName: string,
    private readonly timeoutMs: number // The SDK handles timeouts and retries internally.
  ) {
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.generationConfig = {
      // This instructs Gemini to output a JSON object.
      responseMimeType: 'application/json',
    };
  }

  async analyzeDmlSnippet(snippet: CodeSnippet): Promise<DmlAnalysis[]> {
    const prompt = `
      You are a meticulous and precise code and SQL analyst. Your task is to analyze the following code snippet and identify ONLY executable Data Manipulation Language (DML) statements.

      CRITICAL INSTRUCTIONS:
      1.  Only identify SQL queries that are clearly sql statements.
      2.  You MUST ignore the DML keywords (INSERT, UPDATE, DELETE, MERGE) if they appear in comments, variable names, function names, or simple strings that are not part of a query.
      3.  For each valid DML statement you find, extract the operation, the literal target table name, and a brief description.
      4.  If the table name is a variable or constructed from parts, you MUST discard it. Only report statements where the table name is a clear, static string.
      5.  If you do not find any valid, executable DML statements with clear table names, you MUST return an empty array for the "dml_statements" key.

      Respond with a JSON object containing a single key "dml_statements", which is an array of objects. Each object must have the keys "operation", "table", and "description".

      Code Snippet:
      \`\`\`
      ${snippet.code}
      \`\`\`
    `;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: this.generationConfig,
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const jsonText = response.text();

      if (!jsonText) {
        console.warn('Gemini response did not contain valid text content.');
        return [];
      }

      const jsonResponse = JSON.parse(jsonText);

      if (!Array.isArray(jsonResponse.dml_statements)) {
        return [];
      }

      return jsonResponse.dml_statements.map((item: any) => ({
        ...item,
        sourceFile: snippet.filePath,
        sourceLine: snippet.line,
      }));

    } catch (error) {
      console.error('Error analyzing snippet with Gemini SDK:', error);
      return [];
    }
  }
}
