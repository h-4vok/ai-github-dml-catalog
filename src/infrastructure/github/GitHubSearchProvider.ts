// src/infrastructure/github/GitHubSearchProvider.ts

import { I_CodeSearchProvider } from '@/core/domain/ports';
import { CodeSnippet } from '@/core/domain/models';
import { Octokit } from 'octokit';

/**
 * An efficient implementation of I_CodeSearchProvider that uses the GitHub Code Search API
 * to find DML statements directly. This version can search within an organization OR a user's account.
 */
export class GitHubSearchProvider implements I_CodeSearchProvider {
  private readonly octokit: Octokit;
  private readonly dmlKeywords = ['INSERT', 'UPDATE', 'DELETE', 'MERGE'];
  private readonly searchQualifier: string;

  constructor(
    private readonly authToken: string,
    private readonly fileExtensions: string[], // Kept for potential future use, but not used in the query
    private readonly orgName?: string,
    private readonly userName?: string,
    private readonly branchName?: string
  ) {
    this.octokit = new Octokit({ auth: this.authToken });

    if (orgName) {
      this.searchQualifier = `org:${orgName}`;
    } else if (userName) {
      this.searchQualifier = `user:${userName}`;
    } else {
      throw new Error('Must provide either an organization or a user name.');
    }
  }

  async *findDmlSnippets(): AsyncGenerator<CodeSnippet> {
    console.log(`Searching for DML keywords in: ${this.searchQualifier}`);
    if (this.branchName) {
      console.log(`Targeting branch: ${this.branchName}`);
    }

    const branchQuery = this.branchName ? ` branch:${this.branchName}` : '';

    // FIX: Execute one simplified query per DML keyword, without path/extension filters.
    for (let i = 0; i < this.dmlKeywords.length; i++) {
        const keyword = this.dmlKeywords[i];

        // FIX: Add a 2-second delay between queries to avoid rate limiting.
        // We skip the delay for the very first query.
        if (i > 0) {
            console.log('Waiting for 2 seconds to respect rate limits...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const query = `${keyword} ${this.searchQualifier}${branchQuery}`;
        console.log(`Executing search query: "${query}"`);

        try {
            const searchIterator = this.octokit.paginate.iterator(
            this.octokit.rest.search.code,
            { q: query }
            );

            for await (const { data: searchResults } of searchIterator) {
            for (const item of searchResults) {
                const content = await this.getFileContent(item.repository.full_name, item.path);
                if (!content) continue;

                const lines = content.split('\n');
                const targetLineIndex = this.findLineIndexContainingMatch(lines, item.text_matches);

                if (targetLineIndex !== -1) {
                    const start = Math.max(0, targetLineIndex - 2);
                    const end = Math.min(lines.length, targetLineIndex + 3);
                    const codeContext = lines.slice(start, end).join('\n');

                    yield {
                        repoName: item.repository.name,
                        filePath: item.path,
                        line: targetLineIndex + 1,
                        code: codeContext,
                    };
                }
            }
            }
        } catch (error: any) {
            console.error(`Error searching for query "${query}":`, error.message);
            if (error.status === 403) {
                console.warn('Rate limit likely hit. The script will continue after a longer delay.');
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s on hard failure
            }
        }
    }
  }

  private async getFileContent(repoFullName: string, path: string): Promise<string | null> {
    try {
        const [owner, repo] = repoFullName.split('/');
        const ref = this.branchName ? { ref: this.branchName } : {};
        const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path, ...ref });
        if ('content' in data) {
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch content for ${repoFullName}/${path}:`, error);
        return null;
    }
  }

  private findLineIndexContainingMatch(lines: string[], text_matches: any[]): number {
    if (!text_matches || text_matches.length === 0) return -1;
    const matchFragment = text_matches[0].fragment;
    return lines.findIndex(line => line.includes(matchFragment));
  }
}
