// src/infrastructure/config/Environment.ts

/**
 * A strongly-typed class to load, validate, and provide environment variables.
 */
export class Environment {
  public readonly githubToken: string;
  public readonly githubOrgName?: string;
  public readonly githubUserName?: string;
  public readonly githubBranchName?: string;
  public readonly llmProvider: 'ollama' | 'cloud' | 'gemini';
  public readonly llmTimeoutMs: number;
  public readonly llmRequestDelayMs: number;
  public readonly saveRejectedCandidates: boolean;
  public readonly searchDmlKeywords: string[]; // FIX: Added this property
  public readonly scannerFileExtensions: string[];
  public readonly ollamaBaseUrl: string;
  public readonly ollamaModel: string;
  public readonly cloudApiKey: string;
  public readonly cloudApiUrl: string;
  public readonly cloudModel: string;
  public readonly geminiApiKey: string;
  public readonly geminiModel: string;

  constructor() {
    this.githubToken = this.getOrThrow('GITHUB_TOKEN');
    this.githubOrgName = process.env.GITHUB_ORG_NAME;
    this.githubUserName = process.env.GITHUB_USER_NAME;
    this.githubBranchName = process.env.GITHUB_BRANCH_NAME;

    if (!this.githubOrgName && !this.githubUserName) {
      throw new Error('You must provide either GITHUB_ORG_NAME or GITHUB_USER_NAME in the .env file.');
    }

    const provider = this.getOrThrow('LLM_PROVIDER').toLowerCase();
    // FIX: Added 'gemini' to the valid provider check.
    if (provider !== 'ollama' && provider !== 'cloud' && provider !== 'gemini') {
      throw new Error("LLM_PROVIDER must be 'ollama', 'cloud', or 'gemini'");
    }
    this.llmProvider = provider as 'ollama' | 'cloud' | 'gemini';

    this.llmTimeoutMs = parseInt(process.env.LLM_TIMEOUT_MS || '360000', 10);
    this.llmRequestDelayMs = parseInt(process.env.LLM_REQUEST_DELAY_MS || '1000', 10);
    this.saveRejectedCandidates = (process.env.SAVE_REJECTED_CANDIDATES || 'false').toLowerCase() === 'true';

    // FIX: Added logic to load the configurable DML keywords.
    const dmlKeywords = process.env.SEARCH_DML_KEYWORDS || 'INSERT,UPDATE,DELETE,MERGE';
    this.searchDmlKeywords = dmlKeywords.split(',').map(kw => kw.trim().toUpperCase());

    const extensions = process.env.SCANNER_FILE_EXTENSIONS || '.php,.go,.java,.cs,.py,.rb,.js,.ts,.sql';
    this.scannerFileExtensions = extensions.split(',').map(ext => ext.trim());

    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3';

    this.cloudApiKey = process.env.CLOUD_API_KEY || '';
    this.cloudApiUrl = process.env.CLOUD_API_URL || '';
    this.cloudModel = process.env.CLOUD_MODEL || '';

    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  private getOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}
