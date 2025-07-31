
import { I_LlmClient } from '@/core/domain/ports';
import { CodeSnippet, DmlAnalysis } from '@/core/domain/models';
import { promptWithSnippet } from './prompt';

/**
 * Concrete implementation of I_LlmClient for a local Ollama instance.
 */
export class OllamaClient implements I_LlmClient {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly timeoutMs: number
  ) {}

  async analyzeDmlSnippet(snippet: CodeSnippet): Promise<DmlAnalysis[]> {

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: promptWithSnippet(snippet),
          stream: false,
          format: 'json',
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Ollama API request failed with status ${response.status}`);
      }

      const result : any = await response.json();
      const jsonResponse = JSON.parse(result.response);

      if (!Array.isArray(jsonResponse.dml_statements)) {
        return [];
      }

      // The LLM doesn't know the line number, so we use the placeholder from the snippet.
      return jsonResponse.dml_statements.map((item: any) => ({
        ...item,
        sourceFile: snippet.filePath,
        sourceLine: snippet.line,
      }));

    } catch (error) {
      console.error('Error analyzing snippet with Ollama:', error);
      return [];
    }
  }

  private buildPrompt(code: string): string {
    return `
      You are an expert code and SQL analyst. Analyze the following file content.
      Identify all DML statements (INSERT, UPDATE, DELETE, MERGE). Ignore SELECT statements.
      For each DML statement, extract the operation type, the target table name, and a brief description of the data being modified.
      If you cannot clearly determine the table name due to string formatting or variables, set the table name to 'ambiguous'.

      Respond with a JSON object containing a single key "dml_statements", which is an array of objects. Each object should have the keys "operation", "table", and "description".
      If no DML statements are found, return an empty array.

      File Content:
      \`\`\`
      ${code}
      \`\`\`
    `;
  }
}
