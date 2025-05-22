"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGitHubCLI = validateGitHubCLI;
exports.listOpenPRs = listOpenPRs;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function validateGitHubCLI(logger) {
    try {
        await execAsync('gh --version');
        logger.info('GitHub CLI is installed');
        const { stdout } = await execAsync('gh auth status');
        if (!stdout.includes('Logged in to github.com')) {
            throw new Error('GitHub CLI is not authenticated');
        }
        logger.info('GitHub CLI is authenticated');
    }
    catch (error) {
        throw new Error('GitHub CLI validation failed: ' + (error instanceof Error ? error.message : String(error)));
    }
}
async function listOpenPRs(logger) {
    try {
        const { stdout } = await execAsync('gh pr list --state open --json number,title,headRefName,author');
        return JSON.parse(stdout);
    }
    catch (error) {
        logger.error('Failed to list open PRs:', error);
        throw error;
    }
}
