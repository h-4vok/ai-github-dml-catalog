// src/infrastructure/llm/CloudLlmClient.ts

import { I_LlmClient } from '@/core/domain/ports';
import { CodeSnippet, DmlAnalysis } from '@/core/domain/models';
import { prompt } from './prompt';
/**
 * Concrete implementation of I_LlmClient for a cloud-based LLM provider
 * like OpenAI.
 */
export class CloudLlmClient implements I_LlmClient {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly timeoutMs: number
  ) {}

  async analyzeDmlSnippet(snippet: CodeSnippet): Promise<DmlAnalysis[]> {
    const systemPrompt = prompt;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        }, // <-- FIX: Added the missing comma here.
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this file content:\n\n\`\`\`\n${snippet.code}\n\`\`\`` },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Cloud LLM API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const jsonResponse = JSON.parse(result.choices[0].message.content);

      if (!Array.isArray(jsonResponse.dml_statements)) {
        return [];
      }

      return jsonResponse.dml_statements.map((item: any) => ({
        ...item,
        sourceFile: snippet.filePath,
        sourceLine: snippet.line,
      }));

    } catch (error) {
      console.error('Error analyzing snippet with Cloud LLM:', error);
      return [];
    }
  }
}
