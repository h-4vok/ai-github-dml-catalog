// src/core/services/DmlAnalysisService.ts

import { I_LlmClient, I_FileScanner, I_SourceCodeProvider, I_ResultStorage } from '../domain/ports';
import { RepoDmlCatalog } from '../domain/models';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * DmlAnalysisService is the central orchestrator for the application.
 * It uses the ports (interfaces) to coordinate the workflow, remaining
 * completely independent of the specific implementations (infrastructure).
 */
export class DmlAnalysisService {
  constructor(
    private readonly sourceCodeProvider: I_SourceCodeProvider,
    private readonly fileScanner: I_FileScanner,
    private readonly llmClient: I_LlmClient,
    private readonly resultStorage: I_ResultStorage
  ) {}

  /**
   * Executes the entire DML catalog generation process.
   */
  public async execute(): Promise<void> {
    console.log('Starting DML Catalog Bot...');
    const tempDir = 'temp_repos';

    console.log(`Preparing temporary directory: ${tempDir}`);
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
    await mkdir(tempDir, { recursive: true });

    const repos = await this.sourceCodeProvider.getOrganizationRepos();

    if (repos.length === 0) {
      console.log(`No repositories found to analyze.`);
    } else {
      const repoCount = repos.length;
      const repoSample = repos.slice(0, 5).map(r => r.name).join(', ');
      const orgName = repos[0]?.orgName || 'your organization';
      console.log(`Found ${repoCount} repositories in organization "${orgName}".`);
      console.log(`Analyzing first ${Math.min(5, repoCount)}: ${repoSample}${repoCount > 5 ? '...' : ''}`);
    }

    const allCatalogs: RepoDmlCatalog[] = [];

    for (const repo of repos) {
      const localRepoPath = join(tempDir, repo.name);
      console.log(`\n--- Analyzing repository: ${repo.orgName}/${repo.name} ---`);

      try {
        console.log(`Cloning into ${localRepoPath}...`);
        await this.sourceCodeProvider.cloneRepo(repo, localRepoPath);
      } catch (error) {
        console.error(`Failed to clone repository ${repo.name}. Skipping.`);
        continue; // Immediately skip to the next repo on clone failure
      }

      try {
        const dmlImpacts = [];
        console.log('Scanning for DML statements...');
        for await (const snippet of this.fileScanner.scan(localRepoPath, repo.name)) {
          console.log(`  -> Found potential DML in ${snippet.filePath}:${snippet.line}. Analyzing with LLM...`);
          const analyses = await this.llmClient.analyzeDmlSnippet(snippet);
          if (analyses.length > 0) {
            dmlImpacts.push(...analyses);
          }
        }

        const repoCatalog: RepoDmlCatalog = {
          repoName: repo.name,
          analyzedAt: new Date().toISOString(),
          dmlImpacts,
        };
        allCatalogs.push(repoCatalog);

        console.log(`Analysis for ${repo.name} complete. Found ${dmlImpacts.length} DML impacts.`);
      } catch (error) {
        console.error(`An error occurred during scanning or analysis for repository ${repo.name}. Skipping.`, error);
      } finally {
        if (existsSync(localRepoPath)) {
            console.log(`Cleaning up ${localRepoPath}...`);
            await rm(localRepoPath, { recursive: true, force: true });
        }
      }
    }

    if (allCatalogs.length > 0) {
        console.log('\n--- Generating Final Catalog ---');
        await this.resultStorage.save(allCatalogs);
        console.log('DML catalog has been successfully generated.');
    }
  }
}
