import { CheckboxFunction, checkboxPrompt } from './interactions';
import { listOpenPRs, PullRequest } from './github';
import { resetBranch, mergePR } from './git';
import { Logger } from './logger';
import { execAsync, ExecFunction } from './utils';

function formatPRTitle(pr: PullRequest): string {
  return pr.isDraft ? `📝 ${pr.title}` : pr.title;
}

async function selectPRs(
  prs: PullRequest[], 
  logger: Logger, 
  checkbox: CheckboxFunction = checkboxPrompt
): Promise<PullRequest[]> {
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
  logger: Logger,
  exec: ExecFunction = execAsync
): Promise<void> {
  try {
    // Reset the target branch to the base branch
    const resetMessage = `Reset ${target} to ${base}`;
    const resetTask = logger.task(resetMessage);
    await resetBranch(target, base, dryRun, logger, exec);
    resetTask.complete();

    // Get list of open PRs
    const fetchTask = logger.task('Fetching PRs');
    const prs = await listOpenPRs(logger, includeDrafts, exec);
    fetchTask.complete();

    if (prs.length === 0) {
      logger.complete('No open PRs found');
      return;
    }

    // Prompt user to select PRs to merge
    const selectedPRs = await selectPRs(prs, logger, checkboxPrompt);

    if (selectedPRs.length === 0) {
      logger.complete('No PRs selected');
      return;
    }

    // Merge selected PRs
    for (const pr of selectedPRs) {
      const mergeMessage = `Merge #${pr.number}`;
      const mergeTask = logger.task(mergeMessage);
      const result = await mergePR(pr.headRefName, dryRun, logger, exec);
      if (result === true) {
        mergeTask.complete();
      } else if (result === false) {
        mergeTask.fail();
        logger.info(`Skipped #${pr.number}`);
      } else if ('aborted' in result) {
        mergeTask.fail();
        logger.info('Process aborted by user');
        return;
      }
    }

    // Push the updated target branch if auto-push is enabled
    if (!dryRun) {
      if (autoPush) {
        const pushTask = logger.task(`Push ${target}`);
        await exec(`git push origin ${target}`);
        pushTask.complete();
      } else {
        logger.complete(`Ready to push. Run: git push origin ${target}`);
      }
    }
  } catch (error) {
    logger.error('Failed:', error);
    throw error;
  }
} 