#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const logger_1 = require("./logger");
const github_1 = require("./github");
const curator_1 = require("./curator");
const program = new commander_1.Command();
program
    .name('git-curate')
    .description('A CLI tool for curating Git branches and managing PRs')
    .version('1.0.0')
    .argument('<target>', 'target branch to curate')
    .option('--base <branch>', 'base branch to reset from', 'main')
    .option('--dry-run', 'show actions without executing')
    .option('--log-level <level>', 'set the logging level', 'info')
    .action(async (target, options) => {
    try {
        // Configure logger
        const logger = (0, logger_1.configureLogger)(options.logLevel);
        // Validate GitHub CLI
        await (0, github_1.validateGitHubCLI)(logger);
        // Run the curation process
        await (0, curator_1.curateBranch)(target, options.base, options.dryRun, logger);
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
});
program.parse();
