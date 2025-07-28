// src/core/domain/ports.ts

import { CodeSnippet, DmlAnalysis, RepoDmlCatalog } from './models';

/**
 * Port for providing code snippets that match a specific query.
 * This abstracts the source of the code, which is now a search API instead of a local clone.
 */
export interface I_CodeSearchProvider {
  findDmlSnippets(): AsyncGenerator<CodeSnippet>;
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
