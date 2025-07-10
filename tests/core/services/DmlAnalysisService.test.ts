// tests/core/services/DmlAnalysisService.test.ts

import { describe, it, expect, mock } from 'bun:test';
import { DmlAnalysisService } from '@/core/services/DmlAnalysisService';
import { I_SourceCodeProvider, I_FileScanner, I_LlmClient, I_ResultStorage } from '@/core/domain/ports';
import { RepoInfo, CodeSnippet, DmlAnalysis, RepoDmlCatalog } from '@/core/domain/models';

describe('DmlAnalysisService', () => {
  it('should execute the full workflow correctly', async () => {
    // 1. Setup Mocks for all dependencies (ports)
    const mockSourceProvider: I_SourceCodeProvider = {
      getOrganizationRepos: mock(async (): Promise<RepoInfo[]> => [{ name: 'test-repo', cloneUrl: 'url', orgName: 'test-org' }]),
      cloneRepo: mock(async () => {}),
    };

    const mockFileScanner: I_FileScanner = {
      scan: mock(async function* (): AsyncGenerator<CodeSnippet> {
        yield { repoName: 'test-repo', filePath: 'a.py', line: 1, code: 'UPDATE users' };
      }),
    };

    const mockLlmClient: I_LlmClient = {
      analyzeDmlSnippet: mock(async (snippet: CodeSnippet): Promise<DmlAnalysis[]> => [
        {
          operation: 'UPDATE',
          table: 'users',
          description: 'Updates users table',
          sourceFile: snippet.filePath,
          sourceLine: snippet.line,
        },
      ]),
    };

    const mockResultStorage: I_ResultStorage = {
      save: mock(async (catalogs: RepoDmlCatalog[]) => {
        // Assertions on the final output can be made here
        expect(catalogs.length).toBe(1);
        expect(catalogs[0].repoName).toBe('test-repo');
        expect(catalogs[0].dmlImpacts[0].table).toBe('users');
      }),
    };

    // 2. Instantiate the service with mocked dependencies
    const service = new DmlAnalysisService(
      mockSourceProvider,
      mockFileScanner,
      mockLlmClient,
      mockResultStorage
    );

    // 3. Execute the service
    await service.execute();

    // 4. Verify that the mocks were called as expected
    expect(mockSourceProvider.getOrganizationRepos).toHaveBeenCalledTimes(1);
    expect(mockSourceProvider.cloneRepo).toHaveBeenCalledTimes(1);
    expect(mockFileScanner.scan).toHaveBeenCalledTimes(1);
    expect(mockLlmClient.analyzeDmlSnippet).toHaveBeenCalledTimes(1);
    expect(mockResultStorage.save).toHaveBeenCalledTimes(1);
  });
});
