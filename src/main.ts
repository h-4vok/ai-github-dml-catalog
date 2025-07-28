// src/main.ts

import { DmlAnalysisService } from '@/core/services/DmlAnalysisService';
import { Environment } from '@/infrastructure/config/Environment';
import { GitHubSearchProvider } from '@/infrastructure/github/GitHubSearchProvider';
import { OllamaClient } from '@/infrastructure/llm/OllamaClient';
import { CloudLlmClient } from '@/infrastructure/llm/CloudLlmClient';
import { JsonStorage } from '@/infrastructure/storage/JsonStorage';
import { I_LlmClient } from './core/domain/ports';

/**
 * The Composition Root.
 * This wires together the new, more efficient search-based architecture.
 */
async function main() {
  try {
    const env = new Environment();

    const codeSearchProvider = new GitHubSearchProvider(
      env.githubToken,
      env.githubOrgName,
      env.scannerFileExtensions
    );
    const resultStorage = new JsonStorage('dml_catalog.json');

    let llmClient: I_LlmClient;
    if (env.llmProvider === 'ollama') {
      console.log(`Using Ollama LLM provider with model: ${env.ollamaModel}`);
      llmClient = new OllamaClient(
        env.ollamaBaseUrl,
        env.ollamaModel,
        env.llmTimeoutMs
      );
    } else {
      console.log(`Using Cloud LLM provider with model: ${env.cloudModel}`);
      llmClient = new CloudLlmClient(
        env.cloudApiUrl,
        env.cloudApiKey,
        env.cloudModel,
        env.llmTimeoutMs
      );
    }

    const analysisService = new DmlAnalysisService(
      codeSearchProvider,
      llmClient,
      resultStorage
    );

    await analysisService.execute();
  } catch (error) {
    console.error('An unrecoverable error occurred:', error);
    process.exit(1);
  }
}

main();
