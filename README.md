# GitHub DML Catalog Bot

This project is a bot designed to connect to a GitHub organization, scan all repositories for data manipulation language (DML) statements (`INSERT`, `UPDATE`, `DELETE`, `MERGE`), and use a Large Language Model (LLM) to generate a catalog of which services impact which database tables.

Built with Bun and TypeScript, following Clean Architecture principles for maintainability and testability.

## Features

* Connects to any GitHub organization using a Personal Access Token.
* Clones repositories locally for analysis.
* Scans a wide range of programming language files for DML keywords.
* Uses a configurable LLM (local Ollama or a cloud provider) to analyze code snippets.
* Identifies target tables and the nature of data modification.
* Handles ambiguous table names gracefully.
* Generates a structured JSON catalog of the results.
* High-quality codebase with linting, formatting, and unit tests.

## Prerequisites

* [Bun](https://bun.sh/) installed (`curl -fsSL https://bun.sh/install | bash`)
* Git installed on your system.
* A GitHub Personal Access Token (PAT) with `repo` scope.

## Setup

1. **Clone the repository:**
   ```
   git clone <repository_url>
   cd github-dml-catalog-bot
   ```

2. **Install dependencies:**
   ```
   bun install
   ```

3. **Set up environment variables:**
   * Copy the example environment file:
     ```
     cp .env.example .env
     ```
   * Edit the `.env` file with your specific configuration (GitHub token, organization name, LLM settings).
   ```
   # .env

   # --- GitHub Configuration ---
   GITHUB_TOKEN=your_github_pat
   GITHUB_ORG_NAME=your-github-org

   # --- LLM Provider Configuration ---
   LLM_PROVIDER=ollama # 'ollama' or 'cloud'

   # --- Ollama Configuration ---
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3

   # --- Cloud LLM Configuration ---
   CLOUD_API_KEY=your_cloud_api_key
   CLOUD_API_URL=[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)
   CLOUD_MODEL=gpt-4o
   ```

## Usage

To run the analysis and generate the catalog, simply execute the start script:
```
bun start
```

The process will:
1. Connect to GitHub and fetch your organization's repositories.
2. Clone each repository into a temporary `temp_repos` directory.
3. Scan the code for DML statements.
4. Send snippets to the configured LLM for analysis.
5. Generate a `dml_catalog.json` file in the root directory with the results.

## Development

This project includes a full suite of development tools to ensure code quality.

* **Run tests:**
  ```
  bun test
  ```

* **Check for linting errors:**
  ```
  bun lint
  ```
