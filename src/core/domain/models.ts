// src/core/domain/models.ts

/**
 * Represents a single repository within the organization.
 */
export interface RepoInfo {
  name: string;
  cloneUrl: string;
}

/**
 * Represents a snippet of code identified as a candidate for DML analysis.
 */
export interface CodeSnippet {
  repoName: string;
  filePath: string;
  line: number;
  code: string;
}

/**
 * Represents a snippet that was analyzed by the LLM but found to contain no DML.
 * For simplicity, it has the same structure as a CodeSnippet.
 */
export type RejectedSnippet = CodeSnippet;

/**
 * Represents the structured analysis of a DML statement found in a code snippet.
 */
export interface DmlAnalysis {
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'MERGE';
  table: string; // Can be 'ambiguous' if the LLM cannot determine the table name.
  description: string; // LLM-generated summary of the data being modified.
  sourceFile: string;
  sourceLine: number;
}

/**
 * Represents the final catalog entry for a single repository.
 */
export interface RepoDmlCatalog {
  repoName: string;
  analyzedAt: string;
  dmlImpacts: DmlAnalysis[];
}
