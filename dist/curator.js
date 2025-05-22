"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.curateBranch = curateBranch;
const prompts_1 = require("@inquirer/prompts");
const child_process_1 = require("child_process");
const util_1 = require("util");
const github_1 = require("./github");
const git_1 = require("./git");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function curateBranch(target, base, dryRun, logger) {
    try {
        // Reset the target branch to the base branch
        logger.info(`Resetting ${target} branch to ${base}`);
        await (0, git_1.resetBranch)(target, base, dryRun, logger);
        // Get list of open PRs
        logger.info('Fetching open PRs');
        const prs = await (0, github_1.listOpenPRs)(logger);
        if (prs.length === 0) {
            logger.info('No open PRs found');
            return;
        }
        // Prompt user to select PRs to merge
        const selectedPRs = await (0, prompts_1.checkbox)({
            message: 'Select PRs to merge:',
            choices: prs.map(pr => ({
                name: `#${pr.number}: ${pr.title} (${pr.author.login})`,
                value: pr
            }))
        });
        if (selectedPRs.length === 0) {
            logger.info('No PRs selected');
            return;
        }
        // Merge selected PRs
        for (const pr of selectedPRs) {
            logger.info(`Merging PR #${pr.number}: ${pr.title}`);
            await (0, git_1.mergePR)(pr.headRefName, dryRun, logger);
        }
        // Push the updated target branch
        if (!dryRun) {
            logger.info(`Pushing updated ${target} branch`);
            await execAsync(`git push origin ${target}`);
        }
        logger.info('Branch curation completed successfully');
    }
    catch (error) {
        logger.error('Branch curation failed:', error);
        throw error;
    }
}
