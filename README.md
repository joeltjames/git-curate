# git-curate

A CLI tool for curating Git branches and managing PRs.

[![npm version](https://img.shields.io/npm/v/git-curate.svg)](https://www.npmjs.com/package/git-curate)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

![Demo](/images/demo.gif)

## Installation

### Using yarn (recommended)
```bash
yarn global add git-curate
```

### Using npm
```bash
npm install -g git-curate
```

### Prerequisites
1. Install the GitHub CLI (`gh`) and authenticate:
   ```bash
   brew install gh
   gh auth login
   ```

## Usage

```bash
git-curate <target> [options]
```

### Arguments

- `<target>` - The branch to curate

### Options

- `--base <branch>` - Base branch to reset from (default: main)
- `--dry-run` - Show actions without executing
- `-v, --verbose` - Enable verbose logging output
- `--include-drafts` - Include draft pull requests in the selection
- `--auto-push` - Automatically push changes after merging PRs
- `--help` - Display help information
- `--version` - Display version information

### Example

```bash
git-curate staging --base main --dry-run
```

## Features

- Resets the target branch to the base branch
- Lists open PRs using GitHub CLI
- Interactively prompts to select PRs to merge
- Handles merge conflicts gracefully
- Supports dry-run mode for testing
- Configurable logging levels
- Automated package building for multiple platforms

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Build the project:
   ```bash
   yarn build
   ```
4. Run tests:
   ```bash
   yarn test
   ```
5. Lint the code:
   ```bash
   yarn lint
   ```
6. Format the code:
   ```bash
   yarn format
   ```
7. Make commits using Commitizen:
   ```bash
   yarn commit
   ```
8. Package the executable:
   ```bash
   yarn package
   ```

## Contributing

This project uses semantic-release for versioning and automated releases. Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages to ensure proper versioning.

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## Code Quality

This project uses:
- **ESLint** - For code quality and style checks
- **Prettier** - For consistent code formatting
- **TypeScript** - For type safety
- **Jest** - For testing

## License

ISC 