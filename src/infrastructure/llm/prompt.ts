import { CodeSnippet } from '@/core/domain/models';

export const prompt = `
      You are a meticulous and precise code and SQL analyst. Your task is to analyze the following code snippet and identify ONLY executable Data Manipulation Language (DML) statements.

      CRITICAL INSTRUCTIONS:
      1.  Only identify SQL queries that are clearly sql statements.
      2.  You MUST ignore the DML keywords (INSERT, UPDATE, DELETE, MERGE) if they appear in comments, variable names, function names, or simple strings that are not part of a query.
      3.  For each valid DML statement you find, extract the operation, the literal target table name, and a brief description.
      4.  If the table name is a variable or constructed from parts, you MUST discard it. Only report statements where the table name is a clear, static string.
      5.  If you do not find any valid, executable DML statements with clear table names, you MUST return an empty array for the "dml_statements" key.

      Respond with a JSON object containing a single key "dml_statements", which is an array of objects. Each object must have the keys "operation", "table", and "description".
`;

export const promptWithSnippet = (snippet : CodeSnippet) =>
      `${prompt}

      Code Snippet:
      \`\`\`
      ${snippet.code}
      \`\`\`
    `;
