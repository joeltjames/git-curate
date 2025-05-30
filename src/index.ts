#!/usr/bin/env node

import { Command } from 'commander';
import { configureLogger } from './logger';
import { curateBranch } from './curator';
import { execAsync } from './utils';
import { validateGitHubCLI } from './github';

const program = new Command();

program
  .name('git-curate')
  .description('A CLI tool for curating Git branches and managing PRs')
  .version('1.0.0')
  .argument('<target>', 'target branch to curate')
  .option('--base <branch>', 'base branch to reset from', 'main')
  .option('--dry-run', 'show actions without executing')
  .option('-v, --verbose', 'enable verbose logging output')
  .option('--include-drafts', 'include draft pull requests in the selection')
  .option('--auto-push', 'automatically push changes after merging PRs')
  .action(
    async (
      target: string,
      options: {
        base: string;
        dryRun: boolean;
        verbose: boolean;
        includeDrafts: boolean;
        autoPush: boolean;
      }
    ) => {
      try {
        // Configure logger
        const logger = configureLogger(options.verbose);

        // Validate GitHub CLI
        await validateGitHubCLI(logger, execAsync);

        // Run the curation process
        await curateBranch(
          target,
          options.base,
          options.dryRun,
          options.includeDrafts,
          options.autoPush,
          logger,
          execAsync
        );
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

program.parse();
