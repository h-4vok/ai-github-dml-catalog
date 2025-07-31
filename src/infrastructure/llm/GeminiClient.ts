// src/infrastructure/llm/GeminiClient.ts

import { I_LlmClient } from '@/core/domain/ports';
import { CodeSnippet, DmlAnalysis } from '@/core/domain/models';
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { promptWithSnippet } from './prompt';

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


    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: this.generationConfig,
      });

      const result = await model.generateContent(promptWithSnippet(snippet));
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
