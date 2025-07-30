// src/main.ts

import { DmlAnalysisService } from '@/core/services/DmlAnalysisService';
import { Environment } from '@/infrastructure/config/Environment';
import { GitHubSearchProvider } from '@/infrastructure/github/GitHubSearchProvider';
import { OllamaClient } from '@/infrastructure/llm/OllamaClient';
import { CloudLlmClient } from '@/infrastructure/llm/CloudLlmClient';
import { GeminiClient } from '@/infrastructure/llm/GeminiClient';
import { JsonStorage } from '@/infrastructure/storage/JsonStorage';
import { I_LlmClient } from './core/domain/ports';

/**
 * The Composition Root.
 * This wires together the application, now with support for Gemini.
 */
async function main() {
  try {
    const env = new Environment();

    const codeSearchProvider = new GitHubSearchProvider(
      env.githubToken,
      env.scannerFileExtensions,
      env.githubOrgName,
      env.githubUserName,
      env.githubBranchName
    );

    const resultStorage = new JsonStorage(
        'dml_catalog.json',
        'dml_catalog_rejected.json'
    );

    let llmClient: I_LlmClient;

    switch (env.llmProvider) {
      case 'ollama':
        console.log(`Using Ollama LLM provider with model: ${env.ollamaModel}`);
        llmClient = new OllamaClient(env.ollamaBaseUrl, env.ollamaModel, env.llmTimeoutMs);
        break;
      case 'cloud':
        console.log(`Using Cloud LLM provider with model: ${env.cloudModel}`);
        llmClient = new CloudLlmClient(env.cloudApiUrl, env.cloudApiKey, env.cloudModel, env.llmTimeoutMs);
        break;
      case 'gemini':
        console.log(`Using Gemini LLM provider with model: ${env.geminiModel}`);
        llmClient = new GeminiClient(env.geminiApiKey, env.geminiModel, env.llmTimeoutMs);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${env.llmProvider}`);
    }

    const analysisService = new DmlAnalysisService(
      codeSearchProvider,
      llmClient,
      resultStorage,
      env.saveRejectedCandidates,
      env.llmRequestDelayMs // Pass the new delay value
    );

    await analysisService.execute();

  } catch (error) {
    console.error('An unrecoverable error occurred:', error);
    process.exit(1);
  }
}

main();
