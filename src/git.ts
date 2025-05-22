import { Logger } from './logger';
import { execAsync, ExecFunction } from './utils';
import { SelectFunction, WaitForEnterFunction, selectPrompt as defaultSelectPrompt, waitForEnter as defaultWaitForEnter } from './interactions';

// Export the interface for test mocking and other uses
export type { SelectFunction, WaitForEnterFunction };

// Expose for testing
export interface MergeConflictResult {
  action: 'continue' | 'skip' | 'abort';
  aborted?: boolean;
}

export async function resetBranch(
  target: string, 
  base: string, 
  dryRun: boolean, 
  logger: Logger,
  exec: ExecFunction = execAsync
): Promise<void> {
  try {
    if (dryRun) {
      logger.info(`Would reset ${target} to ${base}`);
      return;
    }

    const { stdout: currentBranch } = await exec('git branch --show-current');
    if (currentBranch.trim() !== target) {
      await exec(`git checkout ${target}`);
    }

    // Reset to base branch
    await exec(`git reset --hard origin/${base}`);
    await exec(`git clean -fd`);
  } catch (error) {
    logger.error(`Failed to reset ${target} to ${base}:`, error);
    throw error;
  }
}

export async function handleMergeConflict(
  branch: string, 
  logger: Logger, 
  select: SelectFunction = defaultSelectPrompt,
  waitForEnter: WaitForEnterFunction = defaultWaitForEnter,
  exec: ExecFunction = execAsync
): Promise<MergeConflictResult> {
  logger.error(`Merge conflict with branch ${branch}`);

  const action = await select({
    message: 'How would you like to proceed?',
    choices: [
      {
        name: 'Fix conflicts and continue',
        value: 'continue',
        description: 'Edit files to resolve conflicts'
      },
      {
        name: 'Skip this PR',
        value: 'skip',
        description: 'Abort this merge and continue with next PR'
      },
      {
        name: 'Abort entire process',
        value: 'abort',
        description: 'Stop the entire curation process'
      }
    ]
  });

  if (action === 'continue') {
    logger.complete('\nTo resolve conflicts:');
    logger.complete('  1. Edit the conflicting files');
    logger.complete('  2. Run: git add <fixed-files>');
    logger.complete('  3. Run: git commit -m "Resolve merge conflicts"');
    logger.complete('\nPress enter when done...');
    
    await waitForEnter();
    
    try {
      const { stdout: mergeState } = await exec('git rev-parse --git-dir');
      const mergeHeadPath = `${mergeState.trim()}/MERGE_HEAD`;
      const mergeInProgress = await exec(`test -f ${mergeHeadPath}`).then(() => true).catch(() => false);
      
      if (mergeInProgress) {
        logger.info('Completing merge...');
        await exec('git commit -m "Resolve merge conflicts"');
      }
      
      // Check if conflicts were resolved
      await exec('git diff --check');
      return { action: 'continue' };
    } catch (error) {
      logger.error('There are still unresolved conflicts. Please fix them or choose another option.');
      return handleMergeConflict(branch, logger, select, waitForEnter, exec);
    }
  }

  if (action === 'skip') {
    await exec('git merge --abort');
    return { action: 'skip' };
  }

  // abort
  await exec('git merge --abort');
  logger.info('Process aborted by user');
  return { action: 'abort', aborted: true };
}

export async function mergePR(
  branch: string, 
  dryRun: boolean, 
  logger: Logger,
  exec: ExecFunction = execAsync,
  handleConflict: (
    branch: string, 
    logger: Logger, 
    select?: SelectFunction, 
    waitForEnter?: WaitForEnterFunction, 
    exec?: ExecFunction
  ) => Promise<MergeConflictResult> = handleMergeConflict
): Promise<boolean | { aborted: true }> {
  try {
    if (dryRun) {
      logger.info(`Would merge origin/${branch}`);
      return true;
    }

    try {
      await exec(`git merge origin/${branch}`);
      return true;
    } catch (error: any) {
      if (error.stdout?.includes('CONFLICT') || error.stderr?.includes('CONFLICT')) {
        const result = await handleConflict(branch, logger);
        if (result.action === 'skip') {
          return false;
        }
        if (result.action === 'continue') {
          return true;
        }
        if (result.aborted) {
          return { aborted: true };
        }
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Failed to merge origin/${branch}:`, error);
    throw error;
  }
}