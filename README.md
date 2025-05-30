# git-curate

A CLI tool for curating Git branches and managing PRs.

[![npm version](https://img.shields.io/npm/v/git-curate.svg)](https://www.npmjs.com/package/git-curate)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

![Demo](/images/demo.gif)

## What is `git-curate?`

`git-curate` is a CLI tool designed to streamline the process of rebasing and "curating" a branch.

At [Planning Center](https://github.com/planningcenter), we use the `staging` branch as an integration environment. Team members regularly push work to `staging` so others can test, verify, and explore changes collaboratively. While this workflow is ergonomic and efficient, `staging` can become crowded over time.

To keep things tidy, someone typically "resets" the branch — rebasing it onto `main` and selectively merging in relevant open GitHub PRs. While not difficult, this process can be tedious and doesn't always feel great.

`git-curate` automates that workflow:
- Rebases the target branch (e.g., staging) onto the base branch (e.g., `main`)
- Fetches all open pull requests using the GitHub CLI (`gh`)
- Lets you interactively select which PRs to merge
- Merges the selected PRs
- Optionally pushes the updated target branch to the remote


This flow would also work well to create a new branch and merge in some in-flight PRs to start off at the right spot (vs having to manually curate that branch).


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