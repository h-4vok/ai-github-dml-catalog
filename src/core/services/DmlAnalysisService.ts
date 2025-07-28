// src/core/services/DmlAnalysisService.ts

import {
  I_CodeSearchProvider,
  I_LlmClient,
  I_ResultStorage,
} from '../domain/ports';
import { RepoDmlCatalog, DmlAnalysis } from '../domain/models';

/**
 * DmlAnalysisService orchestrates the search and analysis process.
 * It is now much simpler, delegating all code fetching to the search provider.
 */
export class DmlAnalysisService {
  constructor(
    private readonly codeSearchProvider: I_CodeSearchProvider,
    private readonly llmClient: I_LlmClient,
    private readonly resultStorage: I_ResultStorage
  ) {}

  public async execute(): Promise<void> {
    console.log('Starting DML Catalog Bot (Search Mode)...');

    const analysisByRepo = new Map<string, DmlAnalysis[]>();

    console.log('Searching for DML statements across all repositories...');
    for await (const snippet of this.codeSearchProvider.findDmlSnippets()) {
      console.log(
        `  -> Found potential DML in ${snippet.repoName}/${snippet.filePath}:${snippet.line}. Analyzing with LLM...`
      );

      const analyses = await this.llmClient.analyzeDmlSnippet(snippet);
      if (analyses.length > 0) {
        if (!analysisByRepo.has(snippet.repoName)) {
          analysisByRepo.set(snippet.repoName, []);
        }
        analysisByRepo.get(snippet.repoName)?.push(...analyses);
      }
    }

    console.log('\n--- Aggregating Results ---');
    const allCatalogs: RepoDmlCatalog[] = [];
    for (const [repoName, dmlImpacts] of analysisByRepo.entries()) {
      allCatalogs.push({
        repoName,
        analyzedAt: new Date().toISOString(),
        dmlImpacts,
      });
      console.log(
        `Repository: ${repoName}, Found DML impacts: ${dmlImpacts.length}`
      );
    }

    if (allCatalogs.length > 0) {
      console.log('\n--- Generating Final Catalog ---');
      await this.resultStorage.save(allCatalogs);
    } else {
      console.log('No DML statements found across any repositories.');
    }
  }
}
