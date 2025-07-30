// src/core/domain/ports.ts

import { CodeSnippet, DmlAnalysis, RepoDmlCatalog, RejectedSnippet } from './models';

/**
 * Port for providing code snippets that match a specific query.
 */
export interface I_CodeSearchProvider {
  findDmlSnippets(): AsyncGenerator<CodeSnippet>;
}

/**
 * Port for interacting with a Large Language Model.
 */
export interface I_LlmClient {
  analyzeDmlSnippet(snippet: CodeSnippet): Promise<DmlAnalysis[]>;
}

/**
 * Port for persisting the analysis results.
 */
export interface I_ResultStorage {
  save(catalog: RepoDmlCatalog[]): Promise<void>;
  // New method for saving rejected snippets
  saveRejected(rejectedSnippets: RejectedSnippet[]): Promise<void>;
}
