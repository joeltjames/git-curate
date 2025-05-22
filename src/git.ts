import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from './logger';
import { select } from '@inquirer/prompts';
import * as readline from 'readline';

const execAsync = promisify(exec);

export async function resetBranch(target: string, base: string, dryRun: boolean, logger: Logger): Promise<void> {
  try {
    if (dryRun) {
      logger.info(`Would reset ${target} to ${base}`);
      return;
    }

    const { stdout: currentBranch } = await execAsync('git branch --show-current');
    if (currentBranch.trim() !== target) {
      await execAsync(`git checkout ${target}`);
    }

    // Reset to base branch
    await execAsync(`git reset --hard origin/${base}`);
    await execAsync(`git clean -fd`);
  } catch (error) {
    logger.error(`Failed to reset ${target} to ${base}:`, error);
    throw error;
  }
}

async function waitForEnter(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise<void>(resolve => {
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

async function handleMergeConflict(branch: string, logger: Logger): Promise<'continue' | 'skip' | 'abort'> {
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
      const { stdout: mergeState } = await execAsync('git rev-parse --git-dir');
      const mergeHeadPath = `${mergeState.trim()}/MERGE_HEAD`;
      const mergeInProgress = await execAsync(`test -f ${mergeHeadPath}`).then(() => true).catch(() => false);
      
      if (mergeInProgress) {
        logger.info('Completing merge...');
        await execAsync('git commit -m "Resolve merge conflicts"');
      }
      
      // Check if conflicts were resolved
      await execAsync('git diff --check');
      return 'continue';
    } catch (error) {
      logger.error('There are still unresolved conflicts. Please fix them or choose another option.');
      return handleMergeConflict(branch, logger);
    }
  }

  if (action === 'skip') {
    await execAsync('git merge --abort');
    return 'skip';
  }

  // abort
  await execAsync('git merge --abort');
  logger.info('Process aborted by user');
  process.exit(0);
}

export async function mergePR(branch: string, dryRun: boolean, logger: Logger): Promise<boolean> {
  try {
    if (dryRun) {
      logger.info(`Would merge origin/${branch}`);
      return true;
    }

    try {
      await execAsync(`git merge origin/${branch}`);
      return true;
    } catch (error: any) {
      if (error.stdout?.includes('CONFLICT') || error.stderr?.includes('CONFLICT')) {
        const result = await handleMergeConflict(branch, logger);
        if (result === 'skip') {
          return false;
        }
        if (result === 'continue') {
          return true;
        }
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Failed to merge origin/${branch}:`, error);
    throw error;
  }
} 