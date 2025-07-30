// src/core/services/DmlAnalysisService.ts

import { I_CodeSearchProvider, I_LlmClient, I_ResultStorage } from '../domain/ports';
import { RepoDmlCatalog, DmlAnalysis, RejectedSnippet, CodeSnippet } from '../domain/models';

/**
 * DmlAnalysisService orchestrates the search and analysis process.
 * It includes detailed logging for visibility into the analysis pipeline.
 */
export class DmlAnalysisService {
  constructor(
    private readonly codeSearchProvider: I_CodeSearchProvider,
    private readonly llmClient: I_LlmClient,
    private readonly resultStorage: I_ResultStorage,
    private readonly saveRejected: boolean
  ) {}

  public async execute(): Promise<void> {
    console.log('Starting DML Catalog Bot (Search Mode)...');

    const analysisByRepo = new Map<string, DmlAnalysis[]>();
    const rejectedSnippets: RejectedSnippet[] = [];
    const foundSnippets: CodeSnippet[] = [];

    console.log('Searching for DML statements across all repositories...');
    for await (const snippet of this.codeSearchProvider.findDmlSnippets()) {
      foundSnippets.push(snippet);

      console.log(`\n[ANALYZING]: ${snippet.repoName}/${snippet.filePath}:${snippet.line}`);
      console.log(`[CODE]:\n---\n${snippet.code}\n---`);

      const analyses = await this.llmClient.analyzeDmlSnippet(snippet);

      if (analyses.length > 0) {
        console.log(`  -> LLM identified ${analyses.length} DML statement(s).`);
        if (!analysisByRepo.has(snippet.repoName)) {
          analysisByRepo.set(snippet.repoName, []);
        }
        analysisByRepo.get(snippet.repoName)?.push(...analyses);
      } else {
        console.log('  -> LLM reported no DML statements.');
        if (this.saveRejected) {
          console.log('    -> Adding to rejected candidates log.');
          rejectedSnippets.push(snippet);
        }
      }
    }

    // Restored logging for summary of found repos
    const reposWithSnippets = [...new Set(foundSnippets.map(s => s.repoName))];
    if (reposWithSnippets.length > 0) {
        console.log(`\nFound ${foundSnippets.length} potential DML snippets across ${reposWithSnippets.length} repositories:`);
        reposWithSnippets.forEach(repoName => console.log(`  - ${repoName}`));
    } else {
        console.log('\nNo potential DML snippets found in any repository.');
    }

    console.log('\n--- Aggregating Results ---');
    const allCatalogs: RepoDmlCatalog[] = [];
    for (const [repoName, dmlImpacts] of analysisByRepo.entries()) {
      allCatalogs.push({
        repoName,
        analyzedAt: new Date().toISOString(),
        dmlImpacts,
      });
      console.log(`Repository: ${repoName}, Confirmed DML impacts: ${dmlImpacts.length}`);
    }

    if (allCatalogs.length > 0) {
      console.log('\n--- Generating Final Catalog ---');
      await this.resultStorage.save(allCatalogs);
    } else {
      console.log('No confirmed DML statements found across any repositories.');
    }

    console.log({saveRejected: this.saveRejected, rejectedSnippets: rejectedSnippets.length});

    if (this.saveRejected && rejectedSnippets.length > 0) {
        console.log(`\n--- Saving ${rejectedSnippets.length} Rejected Snippets ---`);
        await this.resultStorage.saveRejected(rejectedSnippets);
    }
  }
}
