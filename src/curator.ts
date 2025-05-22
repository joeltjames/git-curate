import { checkbox } from '@inquirer/prompts';
import { exec } from 'child_process';
import { promisify } from 'util';
import { listOpenPRs, PullRequest } from './github';
import { resetBranch, mergePR } from './git';
import { Logger } from './logger';

const execAsync = promisify(exec);

function formatPRTitle(pr: PullRequest): string {
  return pr.isDraft ? `📝 ${pr.title}` : pr.title;
}

async function selectPRs(prs: PullRequest[], logger: Logger): Promise<PullRequest[]> {
  try {
    const selected = await checkbox({
      message: `Select PRs to merge (${prs.length} total):`,
      instructions: 'Use space to select, enter to confirm, Ctrl+C to quit, ↑/↓ to navigate',
      pageSize: 10,
      loop: true,
      prefix: '',
      validate: (value) => {
        if (value.length === 0) {
          return 'Please select at least one PR or press Ctrl+C to quit';
        }
        return true;
      },
      choices: prs.map(pr => ({
        name: formatPRTitle(pr),
        value: pr
      }))
    });

    return selected;
  } catch (error) {
    logger.complete('Selection cancelled');
    return [];
  }
}

export async function curateBranch(
  target: string,
  base: string,
  dryRun: boolean,
  includeDrafts: boolean,
  autoPush: boolean,
  logger: Logger
): Promise<void> {
  try {
    // Reset the target branch to the base branch
    const resetMessage = `Reset ${target} to ${base}`;
    logger.progress(resetMessage);
    await resetBranch(target, base, dryRun, logger);
    logger.complete(resetMessage);

    // Get list of open PRs
    const fetchMessage = 'Fetching PRs';
    logger.progress(fetchMessage);
    const prs = await listOpenPRs(logger, includeDrafts);
    logger.complete(fetchMessage);

    if (prs.length === 0) {
      logger.complete('No open PRs found');
      return;
    }

    // Prompt user to select PRs to merge
    const selectedPRs = await selectPRs(prs, logger);

    if (selectedPRs.length === 0) {
      logger.complete('No PRs selected');
      return;
    }

    // Merge selected PRs
    for (const pr of selectedPRs) {
      const mergeMessage = `Merge #${pr.number}`;
      logger.progress(mergeMessage);
      const success = await mergePR(pr.headRefName, dryRun, logger);
      if (success) {
        logger.complete(mergeMessage);
      } else {
        logger.info(`Skipped #${pr.number}`);
      }
    }

    // Push the updated target branch if auto-push is enabled
    if (!dryRun) {
      if (autoPush) {
        const pushMessage = `Push ${target}`;
        logger.progress(pushMessage);
        await execAsync(`git push origin ${target}`);
        logger.complete(pushMessage);
      } else {
        logger.complete(`Ready to push. Run: git push origin ${target}`);
      }
    }
  } catch (error) {
    logger.error('Failed:', error);
    throw error;
  }
} 