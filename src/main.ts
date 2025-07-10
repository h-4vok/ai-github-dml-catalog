// src/main.ts

import { DmlAnalysisService } from '@/core/services/DmlAnalysisService';
import { Environment } from '@/infrastructure/config/Environment';
import { GitHubProvider } from '@/infrastructure/github/GitHubProvider';
import { KeywordScanner } from '@/infrastructure/scanner/KeywordScanner';
import { OllamaClient } from '@/infrastructure/llm/OllamaClient';
import { CloudLlmClient } from '@/infrastructure/llm/CloudLlmClient';
import { JsonStorage } from '@/infrastructure/storage/JsonStorage';
import { I_LlmClient } from './core/domain/ports';

/**
 * The Composition Root.
 * This is the single place in the application where concrete classes are instantiated
 * and dependencies are wired together.
 */
async function main() {
  try {
    // 1. Load configuration
    const env = new Environment();

    // 2. Instantiate adapters based on configuration
    const sourceCodeProvider = new GitHubProvider(env.githubToken, env.githubOrgName);
    const fileScanner = new KeywordScanner(env.scannerFileExtensions);
    const resultStorage = new JsonStorage('dml_catalog.json');

    let llmClient: I_LlmClient;
    if (env.llmProvider === 'ollama') {
      console.log(`Using Ollama LLM provider with model: ${env.ollamaModel}`);
      llmClient = new OllamaClient(env.ollamaBaseUrl, env.ollamaModel);
    } else {
      console.log(`Using Cloud LLM provider with model: ${env.cloudModel}`);
      llmClient = new CloudLlmClient(env.cloudApiUrl, env.cloudApiKey, env.cloudModel);
    }

    // 3. Instantiate the core service with its dependencies
    const analysisService = new DmlAnalysisService(
      sourceCodeProvider,
      fileScanner,
      llmClient,
      resultStorage
    );

    // 4. Execute the application's main logic
    await analysisService.execute();

  } catch (error) {
    console.error('An unrecoverable error occurred:', error);
    process.exit(1);
  }
}

// Run the application
main();
