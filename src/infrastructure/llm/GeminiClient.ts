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
      You are an expert code and SQL analyst. Analyze the following file content.
      Identify all DML statements (INSERT, UPDATE, DELETE, MERGE). Ignore SELECT statements.
      For each DML statement, extract the operation type, the target table name, and a brief description of the data being modified.
      If you cannot clearly determine the table name due to string formatting or variables, set the table name to 'ambiguous'.

      Respond with a JSON object containing a single key "dml_statements", which is an array of objects. Each object should have the keys "operation", "table", and "description".
      If no DML statements are found, return an empty array.

      File Content:
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
