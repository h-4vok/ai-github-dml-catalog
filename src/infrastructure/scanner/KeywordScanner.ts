// src/infrastructure/scanner/KeywordScanner.ts

import { I_FileScanner } from '@/core/domain/ports';
import { CodeSnippet } from '@/core/domain/models';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';

/**
 * Concrete implementation of I_FileScanner that recursively scans a directory
 * for files with specific extensions and searches for DML keywords.
 */
export class KeywordScanner implements I_FileScanner {
  private readonly dmlKeywords = /\b(INSERT|UPDATE|DELETE|MERGE)\b/i;

  constructor(private readonly fileExtensions: string[]) {}

  async *scan(directoryPath: string, repoName: string): AsyncGenerator<CodeSnippet> {
    const entries = await readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        yield* this.scan(fullPath, repoName);
      } else if (entry.isFile() && this.fileExtensions.includes(extname(entry.name))) {
        yield* this.scanFile(fullPath, repoName);
      }
    }
  }

  private async *scanFile(filePath: string, repoName: string): AsyncGenerator<CodeSnippet> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (this.dmlKeywords.test(lines[i])) {
          // Provide a small context window around the matched line
          const start = Math.max(0, i - 2);
          const end = Math.min(lines.length, i + 3);
          const codeContext = lines.slice(start, end).join('\n');

          yield {
            repoName,
            filePath,
            line: i + 1,
            code: codeContext,
          };
        }
      }
    } catch (error) {
      console.warn(`Could not read or process file ${filePath}:`, error);
    }
  }
}
