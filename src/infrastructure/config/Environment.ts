// src/infrastructure/config/Environment.ts

/**
 * A strongly-typed class to load, validate, and provide environment variables.
 * This centralizes configuration management and provides clear error messages
 * for missing variables.
 */
export class Environment {
  public readonly githubToken: string;
  public readonly githubOrgName: string;
  public readonly llmProvider: 'ollama' | 'cloud';
  public readonly ollamaBaseUrl: string;
  public readonly ollamaModel: string;
  public readonly cloudApiKey: string;
  public readonly cloudApiUrl: string;
  public readonly cloudModel: string;
  public readonly scannerFileExtensions: string[];

  constructor() {
    this.githubToken = this.getOrThrow('GITHUB_TOKEN');
    this.githubOrgName = this.getOrThrow('GITHUB_ORG_NAME');

    const provider = this.getOrThrow('LLM_PROVIDER').toLowerCase();
    if (provider !== 'ollama' && provider !== 'cloud') {
      throw new Error("LLM_PROVIDER must be 'ollama' or 'cloud'");
    }
    this.llmProvider = provider;

    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3';

    this.cloudApiKey = process.env.CLOUD_API_KEY || '';
    this.cloudApiUrl = process.env.CLOUD_API_URL || '';
    this.cloudModel = process.env.CLOUD_MODEL || '';

    const extensions = process.env.SCANNER_FILE_EXTENSIONS || '.php,.go,.java,.cs,.py,.rb,.js,.ts,.sql';
    this.scannerFileExtensions = extensions.split(',').map(ext => ext.trim());
  }

  private getOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}
