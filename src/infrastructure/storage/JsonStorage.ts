// src/infrastructure/storage/JsonStorage.ts

import { I_ResultStorage } from '@/core/domain/ports';
import { RepoDmlCatalog, RejectedSnippet } from '@/core/domain/models';
import { writeFile } from 'fs/promises';

/**
 * Concrete implementation of I_ResultStorage that saves the final catalog
 * and rejected snippets to separate JSON files.
 */
export class JsonStorage implements I_ResultStorage {
  constructor(
    private readonly successFilePath: string,
    private readonly rejectedFilePath: string
  ) {}

  async save(catalogs: RepoDmlCatalog[]): Promise<void> {
    try {
      const jsonContent = JSON.stringify(catalogs, null, 2);
      await writeFile(this.successFilePath, jsonContent, 'utf-8');
      console.log(`DML catalog successfully saved to ${this.successFilePath}`);
    } catch (error) {
      console.error(`Failed to save the DML catalog file:`, error);
      throw new Error('Could not write success results to disk.');
    }
  }

  async saveRejected(rejectedSnippets: RejectedSnippet[]): Promise<void> {
    try {
      const jsonContent = JSON.stringify(rejectedSnippets, null, 2);
      await writeFile(this.rejectedFilePath, jsonContent, 'utf-8');
      console.log(`Rejected snippets log successfully saved to ${this.rejectedFilePath}`);
    } catch (error) {
      console.error(`Failed to save the rejected snippets file:`, error);
      throw new Error('Could not write rejected results to disk.');
    }
  }
}
