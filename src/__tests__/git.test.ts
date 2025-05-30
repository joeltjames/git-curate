import { jest } from '@jest/globals';
import * as git from '../git';
import type { Logger } from '../logger';
import type { ExecFunction } from '../utils';
import type { SelectFunction, WaitForEnterFunction } from '../interactions';
import { createMockLogger } from '../__tests__/setupTests';

// Mock the modules first
jest.mock('child_process');
jest.mock('util');
jest.mock('readline');
jest.mock('@inquirer/prompts');
jest.mock('../utils');
jest.mock('../interactions');

describe('Git Module', () => {
  // Create mock functions
  const mockExecAsync = jest.fn() as jest.MockedFunction<ExecFunction>;
  const mockSelect = jest.fn() as jest.MockedFunction<SelectFunction>;
  const mockWaitForEnter = jest.fn() as jest.MockedFunction<WaitForEnterFunction>;

  // Create a spy for resetBranch and mergePR
  let _resetBranchSpy: jest.SpyInstance;
  let _mergePRSpy: jest.SpyInstance;
  let _handleMergeConflictSpy: jest.SpyInstance;

  let mockLogger: Logger;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    // Use direct imports for mocking
    const util = await import('util');
    jest.spyOn(util, 'promisify').mockReturnValue(() => mockExecAsync);

    const inquirer = await import('@inquirer/prompts');
    jest.spyOn(inquirer, 'select').mockImplementation(() => mockSelect);

    // Create spies on the actual functions
    _resetBranchSpy = jest.spyOn(git, 'resetBranch');
    _mergePRSpy = jest.spyOn(git, 'mergePR');
    _handleMergeConflictSpy = jest.spyOn(git, 'handleMergeConflict');

    // Create a mock logger
    mockLogger = createMockLogger();

    // Reset default behavior for mockExecAsync
    mockExecAsync.mockReset();
    mockWaitForEnter.mockResolvedValue(undefined);
  });

  describe('resetBranch', () => {
    it('should log message only when dryRun is true', async () => {
      await git.resetBranch('feature', 'main', true, mockLogger, mockExecAsync);

      expect(mockLogger.info).toHaveBeenCalledWith('Would reset feature to main');
      expect(mockExecAsync).not.toHaveBeenCalled();
    });

    it('should checkout target branch when current branch is different', async () => {
      mockExecAsync.mockImplementation((cmd: string) => {
        if (cmd === 'git branch --show-current') {
          return Promise.resolve({ stdout: 'other-branch\n', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      await git.resetBranch('feature', 'main', false, mockLogger, mockExecAsync);

      expect(mockExecAsync).toHaveBeenCalledWith('git checkout feature');
      expect(mockExecAsync).toHaveBeenCalledWith('git reset --hard origin/main');
      expect(mockExecAsync).toHaveBeenCalledWith('git clean -fd');
    });

    it('should not checkout target branch when already on it', async () => {
      mockExecAsync.mockImplementation((cmd: string) => {
        if (cmd === 'git branch --show-current') {
          return Promise.resolve({ stdout: 'feature\n', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      await git.resetBranch('feature', 'main', false, mockLogger, mockExecAsync);

      expect(mockExecAsync).not.toHaveBeenCalledWith('git checkout feature');
      expect(mockExecAsync).toHaveBeenCalledWith('git reset --hard origin/main');
      expect(mockExecAsync).toHaveBeenCalledWith('git clean -fd');
    });

    it('should propagate errors and log them', async () => {
      const testError = new Error('Test error');
      mockExecAsync.mockRejectedValue(testError);

      await expect(
        git.resetBranch('feature', 'main', false, mockLogger, mockExecAsync)
      ).rejects.toThrow(testError);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to reset feature to main:', testError);
    });
  });

  describe('handleMergeConflict', () => {
    const mockExec = jest.fn() as jest.MockedFunction<ExecFunction>;
    const mockSelectFn = jest.fn() as jest.MockedFunction<SelectFunction>;
    const mockWaitForEnterFn = jest.fn() as jest.MockedFunction<WaitForEnterFunction>;

    beforeEach(() => {
      mockExec.mockReset();
      mockSelectFn.mockReset();
      mockWaitForEnterFn.mockReset();
      mockWaitForEnterFn.mockResolvedValue();
    });

    it('should return skip result when user chooses skip', async () => {
      mockSelectFn.mockResolvedValue('skip');

      const result = await git.handleMergeConflict(
        'feature',
        mockLogger,
        mockSelectFn,
        mockWaitForEnterFn,
        mockExec
      );

      expect(result).toEqual({ action: 'skip' });
      expect(mockExec).toHaveBeenCalledWith('git merge --abort');
    });

    it('should return abort result when user chooses abort', async () => {
      mockSelectFn.mockResolvedValue('abort');

      const result = await git.handleMergeConflict(
        'feature',
        mockLogger,
        mockSelectFn,
        mockWaitForEnterFn,
        mockExec
      );

      expect(result).toEqual({ action: 'abort', aborted: true });
      expect(mockExec).toHaveBeenCalledWith('git merge --abort');
    });

    it('should handle continue with commit when merge is in progress', async () => {
      mockSelectFn.mockResolvedValue('continue');
      mockExec.mockImplementation((cmd: string) => {
        if (cmd === 'git rev-parse --git-dir') {
          return Promise.resolve({ stdout: '.git', stderr: '' });
        }
        if (cmd === 'test -f .git/MERGE_HEAD') {
          return Promise.resolve({ stdout: '', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await git.handleMergeConflict(
        'feature',
        mockLogger,
        mockSelectFn,
        mockWaitForEnterFn,
        mockExec
      );

      expect(result).toEqual({ action: 'continue' });
      expect(mockWaitForEnterFn).toHaveBeenCalled();
      expect(mockExec).toHaveBeenCalledWith('git commit -m "Resolve merge conflicts"');
    });

    it('should retry on unresolved conflicts', async () => {
      mockSelectFn.mockResolvedValueOnce('continue').mockResolvedValueOnce('skip');
      mockExec.mockImplementation((cmd: string) => {
        if (cmd === 'git diff --check') {
          return Promise.reject(new Error('Unresolved conflicts'));
        }
        if (cmd === 'git rev-parse --git-dir') {
          return Promise.resolve({ stdout: '.git', stderr: '' });
        }
        return Promise.resolve({ stdout: '', stderr: '' });
      });

      const result = await git.handleMergeConflict(
        'feature',
        mockLogger,
        mockSelectFn,
        mockWaitForEnterFn,
        mockExec
      );

      expect(result).toEqual({ action: 'skip' });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'There are still unresolved conflicts. Please fix them or choose another option.'
      );
    });
  });

  describe('mergePR', () => {
    it('should log message only when dryRun is true', async () => {
      const result = await git.mergePR('feature', true, mockLogger, mockExecAsync);

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Would merge origin/feature');
      expect(mockExecAsync).not.toHaveBeenCalled();
    });

    it('should return true on successful merge', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'Success', stderr: '' });

      const result = await git.mergePR('feature', false, mockLogger, mockExecAsync);

      expect(result).toBe(true);
      expect(mockExecAsync).toHaveBeenCalledWith('git merge origin/feature');
    });

    it('should handle merge conflicts', async () => {
      mockExecAsync.mockRejectedValue({
        stdout: 'CONFLICT',
        stderr: '',
      });

      // Mock the handleMergeConflict function
      const mockHandleConflict = jest
        .fn<typeof git.handleMergeConflict>()
        .mockResolvedValue({ action: 'skip' });

      const result = await git.mergePR(
        'feature',
        false,
        mockLogger,
        mockExecAsync,
        mockHandleConflict
      );

      expect(result).toBe(false);
      expect(mockHandleConflict).toHaveBeenCalledWith('feature', mockLogger);
    });

    it('should return true when conflicts are resolved', async () => {
      mockExecAsync.mockRejectedValue({
        stdout: 'CONFLICT',
        stderr: '',
      });

      // Mock the handleMergeConflict function
      const mockHandleConflict = jest
        .fn<typeof git.handleMergeConflict>()
        .mockResolvedValue({ action: 'continue' });

      const result = await git.mergePR(
        'feature',
        false,
        mockLogger,
        mockExecAsync,
        mockHandleConflict as unknown as typeof git.handleMergeConflict
      );

      expect(result).toBe(true);
      expect(mockHandleConflict).toHaveBeenCalledWith('feature', mockLogger);
    });

    it('should return aborted when user chooses to abort', async () => {
      mockExecAsync.mockRejectedValue({
        stdout: 'CONFLICT',
        stderr: '',
      });

      // Mock the handleMergeConflict function
      const mockHandleConflict = jest
        .fn<typeof git.handleMergeConflict>()
        .mockResolvedValue({ action: 'abort', aborted: true });

      const result = await git.mergePR(
        'feature',
        false,
        mockLogger,
        mockExecAsync,
        mockHandleConflict as unknown as typeof git.handleMergeConflict
      );

      expect(result).toEqual({ aborted: true });
      expect(mockHandleConflict).toHaveBeenCalledWith('feature', mockLogger);
    });

    it('should propagate non-conflict errors', async () => {
      const testError = new Error('Non-conflict error');
      mockExecAsync.mockRejectedValue(testError);

      await expect(git.mergePR('feature', false, mockLogger, mockExecAsync)).rejects.toThrow(
        testError
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to merge origin/feature:', testError);
    });
  });
});
