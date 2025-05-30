import { Logger } from './logger';
import { execAsync, ExecFunction } from './utils';

export interface PullRequest {
  number: number;
  title: string;
  headRefName: string;
  author: {
    login: string;
  };
  isDraft: boolean;
}

export async function validateGitHubCLI(
  logger: Logger,
  exec: ExecFunction = execAsync
): Promise<void> {
  try {
    await exec('gh --version');
    logger.info('GitHub CLI is installed');

    const { stdout } = await exec('gh auth status');
    if (!stdout.includes('Logged in to github.com')) {
      throw new Error('GitHub CLI is not authenticated');
    }
    logger.info('GitHub CLI is authenticated');
  } catch (error) {
    throw new Error(
      'GitHub CLI validation failed: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}

export async function listOpenPRs(
  logger: Logger,
  includeDrafts: boolean = false,
  exec: ExecFunction = execAsync
): Promise<PullRequest[]> {
  try {
    const { stdout } = await exec(
      'gh pr list --state open --json number,title,headRefName,author,isDraft'
    );
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
