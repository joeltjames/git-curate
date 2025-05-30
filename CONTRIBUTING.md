# Contributing to git-curate

Thank you for your interest in contributing to git-curate! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `yarn install`
3. Build the project: `yarn build`
4. Run tests: `yarn test`

## Development Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests to ensure everything is working: `yarn test`
4. Run linting: `yarn lint`
5. Format code: `yarn format`
6. Commit your changes using Commitizen: `yarn commit`
7. Push your branch and create a pull request

## Commit Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for standardized commit messages. Please use the `yarn commit` command instead of `git commit` to create properly formatted commit messages.

The commit message should be structured as follows:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types include:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries

## Release Process

Releases are handled automatically using GitHub Actions and semantic-release. When commits are pushed to the main branch:

1. All tests are run
2. If tests pass, semantic-release analyzes the commit messages
3. Based on the commit messages, it determines the next version number
4. A new release is created with release notes generated from commit messages
5. The package is published to npm

## Code Quality

Please ensure your code adheres to the following:

1. All tests pass
2. No ESLint errors or warnings
3. Code is properly formatted with Prettier
4. Follows TypeScript best practices