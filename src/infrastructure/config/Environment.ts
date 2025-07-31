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
    const e = process.env;
    this.githubToken = this.getOrThrow('GITHUB_TOKEN');
    this.githubOrgName = e.GITHUB_ORG_NAME;
    this.githubUserName = e.GITHUB_USER_NAME;
    this.githubBranchName = e.GITHUB_BRANCH_NAME;

    if (!this.githubOrgName && !this.githubUserName) {
      throw new Error('You must provide either GITHUB_ORG_NAME or GITHUB_USER_NAME in the .env file.');
    }

    const provider = this.getOrThrow('LLM_PROVIDER').toLowerCase();
    // FIX: Added 'gemini' to the valid provider check.
    if (provider !== 'ollama' && provider !== 'cloud' && provider !== 'gemini') {
      throw new Error("LLM_PROVIDER must be 'ollama', 'cloud', or 'gemini'");
    }
    this.llmProvider = provider as 'ollama' | 'cloud' | 'gemini';

    this.llmTimeoutMs = parseInt(e.LLM_TIMEOUT_MS || '360000', 10);
    this.llmRequestDelayMs = parseInt(e.LLM_REQUEST_DELAY_MS || '1000', 10);
    this.saveRejectedCandidates = (e.SAVE_REJECTED_CANDIDATES || 'false').toLowerCase() === 'true';

    // FIX: Added logic to load the configurable DML keywords.
    const dmlKeywords = e.SEARCH_DML_KEYWORDS || 'INSERT,UPDATE,DELETE,MERGE';
    this.searchDmlKeywords = dmlKeywords.split(',').map(kw => kw.trim().toUpperCase());

    const extensions = e.SCANNER_FILE_EXTENSIONS || '.php,.go,.java,.cs,.py,.rb,.js,.ts,.sql';
    this.scannerFileExtensions = extensions.split(',').map(ext => ext.trim());

    this.ollamaBaseUrl = e.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = e.OLLAMA_MODEL || 'llama3';

    this.cloudApiKey = e.CLOUD_API_KEY || '';
    this.cloudApiUrl = e.CLOUD_API_URL || '';
    this.cloudModel = e.CLOUD_MODEL || '';

    this.geminiApiKey = e.GEMINI_API_KEY || '';
    this.geminiModel = e.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  private getOrThrow(key: string): string {
    const value = e[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}
