// src/infrastructure/llm/CloudLlmClient.ts

import { I_LlmClient } from '@/core/domain/ports';
import { CodeSnippet, DmlAnalysis } from '@/core/domain/models';

/**
 * Concrete implementation of I_LlmClient for a cloud-based LLM provider
 * like OpenAI.
 */
export class CloudLlmClient implements I_LlmClient {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async analyzeDmlSnippet(snippet: CodeSnippet): Promise<DmlAnalysis[]> {
    const systemPrompt = `
      You are an expert code and SQL analyst. Analyze the user-provided code snippet.
      Identify all DML statements (INSERT, UPDATE, DELETE, MERGE). Ignore SELECT statements.
      For each DML statement, extract the operation type, the target table name, and a brief description of the data being modified.
      If you cannot clearly determine the table name due to string formatting or variables, set the table name to 'ambiguous'.

      You MUST respond with a valid JSON object containing a single key "dml_statements", which is an array of objects. Each object must have the keys "operation", "table", and "description".
      If no DML statements are found, return an empty array: {"dml_statements": []}.
    `;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        }, // <-- FIX: Added a comma here
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze this code:\n\n\`\`\`\n${snippet.code}\n\`\`\`` },
          ],
          response_format: { type: 'json_object' },
        }),
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
