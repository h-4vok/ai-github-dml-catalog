// src/infrastructure/github/GitHubProvider.ts

import { I_SourceCodeProvider } from '@/core/domain/ports';
import { RepoInfo } from '@/core/domain/models';
import { Octokit } from 'octokit';
import simpleGit from 'simple-git';

/**
 * Concrete implementation of I_SourceCodeProvider using the GitHub API (Octokit)
 * and simple-git for cloning.
 */
export class GitHubProvider implements I_SourceCodeProvider {
  private readonly octokit: Octokit;
  private readonly git = simpleGit();

  constructor(
    private readonly authToken: string,
    private readonly orgName: string
  ) {
    this.octokit = new Octokit({ auth: this.authToken });
  }

  async getOrganizationRepos(): Promise<RepoInfo[]> {
    try {
      const repos = await this.octokit.paginate(this.octokit.rest.repos.listForOrg, {
        org: this.orgName,
        type: 'all',
      });
      // FIX: Populate the orgName from the repo's owner information
      return repos.map(repo => ({
        name: repo.name,
        cloneUrl: repo.clone_url,
        orgName: repo.owner.login,
      }));
    } catch (error) {
      console.error('Failed to fetch repositories from GitHub:', error);
      throw new Error('Could not fetch organization repositories.');
    }
  }

  async cloneRepo(repo: RepoInfo, localPath: string): Promise<void> {
    const cloneUrlWithToken = repo.cloneUrl.replace(
      'https://',
      `https://x-access-token:${this.authToken}@`
    );
    try {
      await this.git.clone(cloneUrlWithToken, localPath, ['--depth=1']);
    } catch (error) {
      console.error(`Failed to clone repository ${repo.name}:`, error);
      throw new Error(`Cloning failed for ${repo.name}.`);
    }
  }
}
