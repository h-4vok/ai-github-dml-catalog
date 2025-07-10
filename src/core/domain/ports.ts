// src/core/domain/ports.ts

import {
  RepoInfo,
  CodeSnippet,
  DmlAnalysis,
  RepoDmlCatalog,
} from './models';

/**
 * Port for providing source code from a version control system.
 * This interface defines the contract for fetching repository information and code.
 */
export interface I_SourceCodeProvider {
  getOrganizationRepos(): Promise<RepoInfo[]>;
  cloneRepo(repo: RepoInfo, localPath: string): Promise<void>;
}

/**
 * Port for scanning a directory of files to find candidate code snippets.
 * This decouples the core logic from the file system and scanning strategy.
 */
export interface I_FileScanner {
  scan(directoryPath: string, repoName: string): AsyncGenerator<CodeSnippet>;
}

/**
 * Port for interacting with a Large Language Model.
 * This abstraction allows swapping between local (Ollama) and cloud LLMs.
 */
export interface I_LlmClient {
  analyzeDmlSnippet(snippet: CodeSnippet): Promise<DmlAnalysis[]>;
}

/**
 * Port for persisting the final analysis results.
 * This allows the output format to be changed easily (e.g., to CSV, a database, etc.).
 */
export interface I_ResultStorage {
  save(catalog: RepoDmlCatalog[]): Promise<void>;
}
