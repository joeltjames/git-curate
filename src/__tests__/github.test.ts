import { jest } from '@jest/globals';
import { listOpenPRs } from '../github';
import type { Logger, CompletableTask } from '../logger';
import type { ExecFunction } from '../utils';

// Mock modules
jest.mock('child_process');
jest.mock('util');

describe('GitHub Module', () => {
  const mockExecAsync = jest.fn() as jest.MockedFunction<ExecFunction>;
  let mockLogger: Logger;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    const util = await import('util');
    jest.spyOn(util, 'promisify').mockReturnValue(() => mockExecAsync);

    // Create a mock logger
    const mockTask: CompletableTask = {
      complete: jest.fn(),
      completeWithMessage: jest.fn(),
      fail: jest.fn(),
    };

    const taskFn = (_: string): CompletableTask => mockTask;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      complete: jest.fn(),
      task: taskFn,
    };

    // Reset default behavior for mockExecAsync
    mockExecAsync.mockReset();
  });

  describe('listOpenPRs', () => {
    it('should return empty array when no PRs are found', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '[]',
        stderr: '',
      });

      const result = await listOpenPRs(mockLogger, false, mockExecAsync);

      expect(result).toEqual([]);
      expect(mockExecAsync).toHaveBeenCalledWith(
        'gh pr list --state open --json number,title,headRefName,author,isDraft'
      );
    });

    it('should parse and return PRs correctly', async () => {
      const mockPRs = [
        {
          number: 1,
          title: 'Test PR',
          headRefName: 'feature/test',
          isDraft: false,
          author: { login: 'testuser' },
        },
      ];

      mockExecAsync.mockResolvedValue({
        stdout: JSON.stringify(mockPRs),
        stderr: '',
      });

      const result = await listOpenPRs(mockLogger, false, mockExecAsync);

      expect(result).toEqual(mockPRs);
      expect(mockExecAsync).toHaveBeenCalledWith(
        'gh pr list --state open --json number,title,headRefName,author,isDraft'
      );
    });

    it('should include draft PRs when includeDrafts is true', async () => {
      const mockPRs = [
        {
          number: 1,
          title: 'Draft PR',
          headRefName: 'feature/draft',
          isDraft: true,
          author: { login: 'testuser' },
        },
      ];

      mockExecAsync.mockResolvedValue({
        stdout: JSON.stringify(mockPRs),
        stderr: '',
      });

      const result = await listOpenPRs(mockLogger, true, mockExecAsync);

      expect(result).toEqual(mockPRs);
      expect(mockExecAsync).toHaveBeenCalledWith(
        'gh pr list --state open --json number,title,headRefName,author,isDraft'
      );
    });

    it('should handle GitHub CLI errors', async () => {
      const testError = new Error('GitHub CLI error');
      mockExecAsync.mockRejectedValue(testError);

      await expect(listOpenPRs(mockLogger, false, mockExecAsync)).rejects.toThrow(testError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to list open PRs:', testError);
    });

    it('should handle invalid JSON response', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'invalid json',
        stderr: '',
      });

      await expect(listOpenPRs(mockLogger, false, mockExecAsync)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
