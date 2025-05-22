import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from './logger';

const execAsync = promisify(exec);

export interface PullRequest {
  number: number;
  title: string;
  headRefName: string;
  author: {
    login: string;
  };
  isDraft: boolean;
}

export async function validateGitHubCLI(logger: Logger): Promise<void> {
  try {
    await execAsync('gh --version');
    logger.info('GitHub CLI is installed');
    
    const { stdout } = await execAsync('gh auth status');
    if (!stdout.includes('Logged in to github.com')) {
      throw new Error('GitHub CLI is not authenticated');
    }
    logger.info('GitHub CLI is authenticated');
  } catch (error) {
    throw new Error('GitHub CLI validation failed: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function listOpenPRs(logger: Logger, includeDrafts: boolean = false): Promise<PullRequest[]> {
  try {
    const { stdout } = await execAsync('gh pr list --state open --json number,title,headRefName,author,isDraft');
    const prs: PullRequest[] = JSON.parse(stdout);
    
    if (!includeDrafts) {
      return prs.filter(pr => !pr.isDraft);
    }
    
    return prs;
  } catch (error) {
    logger.error('Failed to list open PRs:', error);
    throw error;
  }
} 