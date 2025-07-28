// src/infrastructure/github/GitHubSearchProvider.ts

import { I_CodeSearchProvider } from '@/core/domain/ports';
import { CodeSnippet } from '@/core/domain/models';
import { Octokit } from 'octokit';

/**
 * An efficient implementation of I_CodeSearchProvider that uses the GitHub Code Search API
 * to find DML statements directly, avoiding the need to clone repositories.
 */
export class GitHubSearchProvider implements I_CodeSearchProvider {
  private readonly octokit: Octokit;
  private readonly dmlKeywords = ['INSERT', 'UPDATE', 'DELETE', 'MERGE'];

  constructor(
    private readonly authToken: string,
    private readonly orgName: string,
    private readonly fileExtensions: string[]
  ) {
    this.octokit = new Octokit({ auth: this.authToken });
  }

  async *findDmlSnippets(): AsyncGenerator<CodeSnippet> {
    console.log(`Searching for DML keywords in organization: ${this.orgName}`);

    const extensionsQuery = this.fileExtensions
      .map((ext) => `extension:${ext}`)
      .join(' ');

    for (const keyword of this.dmlKeywords) {
      const query = `${keyword} org:${this.orgName} ${extensionsQuery}`;
      console.log(`Executing search query: "${query}"`);

      try {
        const searchIterator = this.octokit.paginate.iterator(
          this.octokit.rest.search.code,
          { q: query }
        );

        for await (const { data: searchResults } of searchIterator) {
          for (const item of searchResults) {
            // The search result gives us a text match, but we need more context for the LLM.
            // We'll fetch the full file content to provide that context.
            const content = await this.getFileContent(
              item.repository.full_name,
              item.path
            );
            if (!content) continue;

            const lines = content.split('\n');
            const lineNumber = this.findLineNumber(lines, item.sha); // Search API doesn't give line number directly

            // Heuristic to find the line number from the text match if needed
            const targetLineIndex = this.findLineIndexContainingMatch(
              lines,
              item.text_matches
            );

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
        console.error(
          `Error searching for keyword "${keyword}":`,
          error.message
        );
        if (error.status === 403) {
          console.warn(
            'Rate limit likely hit. The script will continue with the next keyword after a short delay.'
          );
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
        }
      }
    }
  }

  private async getFileContent(
    repoFullName: string,
    path: string
  ): Promise<string | null> {
    try {
      const [owner, repo] = repoFullName.split('/');
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      if ('content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error) {
      console.error(
        `Failed to fetch content for ${repoFullName}/${path}:`,
        error
      );
      return null;
    }
  }

  private findLineIndexContainingMatch(
    lines: string[],
    text_matches: any[]
  ): number {
    if (!text_matches || text_matches.length === 0) return -1;
    const matchFragment = text_matches[0].fragment;
    // Find the first line that contains the matched fragment
    return lines.findIndex((line) => line.includes(matchFragment));
  }

  // This is a placeholder as the search API v3 doesn't provide a reliable line number.
  // The text match heuristic above is more practical.
  private findLineNumber(lines: string[], sha: string): number {
    return 1; // Placeholder
  }
}
