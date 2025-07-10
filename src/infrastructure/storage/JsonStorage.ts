// src/infrastructure/storage/JsonStorage.ts

import { I_ResultStorage } from '@/core/domain/ports';
import { RepoDmlCatalog } from '@/core/domain/models';
import { writeFile } from 'fs/promises';

/**
 * Concrete implementation of I_ResultStorage that saves the final catalog
 * to a JSON file.
 */
export class JsonStorage implements I_ResultStorage {
  constructor(private readonly outputFilePath: string) {}

  async save(catalogs: RepoDmlCatalog[]): Promise<void> {
    try {
      const jsonContent = JSON.stringify(catalogs, null, 2);
      await writeFile(this.outputFilePath, jsonContent, 'utf-8');
      console.log(`Catalog successfully saved to ${this.outputFilePath}`);
    } catch (error) {
      console.error('Failed to save the catalog file:', error);
      throw new Error('Could not write results to disk.');
    }
  }
}
