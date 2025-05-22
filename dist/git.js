"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetBranch = resetBranch;
exports.mergePR = mergePR;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function resetBranch(target, base, dryRun, logger) {
    const commands = [
        'git fetch origin',
        `git checkout ${base}`,
        `git pull origin ${base}`,
        `git checkout ${target}`,
        `git reset --hard origin/${base}`,
        `git push --force origin ${target}`
    ];
    for (const cmd of commands) {
        logger.info(`Executing: ${cmd}`);
        if (!dryRun) {
            try {
                await execAsync(cmd);
            }
            catch (error) {
                logger.error(`Failed to execute ${cmd}:`, error);
                throw error;
            }
        }
    }
}
async function mergePR(branch, dryRun, logger) {
    const commands = [
        `git fetch origin ${branch}`,
        `git merge origin/${branch}`
    ];
    for (const cmd of commands) {
        logger.info(`Executing: ${cmd}`);
        if (!dryRun) {
            try {
                await execAsync(cmd);
            }
            catch (error) {
                logger.error(`Failed to execute ${cmd}:`, error);
                // If there's a merge conflict, abort and throw
                await execAsync('git merge --abort').catch(() => { });
                throw new Error(`Merge conflict with branch ${branch}`);
            }
        }
    }
}
