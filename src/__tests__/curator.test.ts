import { jest } from '@jest/globals';
import * as curator from '../curator';
import { resetBranch, mergePR } from '../git';
import { listOpenPRs } from '../github';
import type { Logger } from '../logger';
import type { ExecFunction } from '../utils';
import { checkboxPrompt, CheckboxFunction } from '../interactions';

// Mock modules
jest.mock('../git');
jest.mock('../github');
jest.mock('../interactions');
jest.mock('child_process');
jest.mock('util');

describe('Curator Module', () => {
  const mockExecAsync = jest.fn() as jest.MockedFunction<ExecFunction>;
  const mockCheckbox = jest.fn() as jest.MockedFunction<CheckboxFunction>;

  let mockLogger: Logger;
  let mockTaskObj: { complete: jest.Mock; completeWithMessage: jest.Mock; fail: jest.Mock };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    (listOpenPRs as jest.MockedFunction<typeof listOpenPRs>).mockImplementation(() =>
      Promise.resolve([])
    );
    (resetBranch as jest.MockedFunction<typeof resetBranch>).mockImplementation(() =>
      Promise.resolve()
    );
    (mergePR as jest.MockedFunction<typeof mergePR>).mockImplementation(() =>
      Promise.resolve(true)
    );
    (checkboxPrompt as unknown as jest.MockedFunction<typeof checkboxPrompt>).mockImplementation(
      mockCheckbox
    );

    // Clear and setup the exec mock
    mockExecAsync.mockReset();
    mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

    // Create a mock logger with task support
    mockTaskObj = {
      complete: jest.fn(),
      completeWithMessage: jest.fn(),
      fail: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      complete: jest.fn(),
      task: jest.fn().mockReturnValue(mockTaskObj) as (message: string) => typeof mockTaskObj,
    };
  });

  describe('curateBranch', () => {
    it('should reset target branch and return early if no PRs found', async () => {
      // Mock empty PRs list
      (listOpenPRs as jest.MockedFunction<typeof listOpenPRs>).mockResolvedValueOnce([]);

      await curator.curateBranch('staging', 'main', false, false, false, mockLogger, mockExecAsync);

      expect(resetBranch).toHaveBeenCalledWith('staging', 'main', false, mockLogger, mockExecAsync);
      expect(listOpenPRs).toHaveBeenCalledWith(mockLogger, false, mockExecAsync);
      expect(mockLogger.complete).toHaveBeenCalledWith('No open PRs found');
      expect(checkboxPrompt).not.toHaveBeenCalled();
    });

    it('should handle no PR selection', async () => {
      // Mock PRs list
      const mockPRs = [
        {
          number: 1,
          title: 'PR 1',
          headRefName: 'feature-1',
          isDraft: false,
          author: { login: 'user1' },
        },
      ];
      (listOpenPRs as jest.MockedFunction<typeof listOpenPRs>).mockResolvedValueOnce(mockPRs);

      // Mock empty selection
      mockCheckbox.mockResolvedValueOnce([]);

      await curator.curateBranch('staging', 'main', false, false, false, mockLogger, mockExecAsync);

      expect(resetBranch).toHaveBeenCalledWith('staging', 'main', false, mockLogger, mockExecAsync);
      expect(listOpenPRs).toHaveBeenCalledWith(mockLogger, false, mockExecAsync);
      expect(checkboxPrompt).toHaveBeenCalled();
      expect(mockLogger.complete).toHaveBeenCalledWith('No PRs selected');
      expect(mergePR).not.toHaveBeenCalled();
    });

    it('should merge selected PRs', async () => {
      // Mock PRs list
      const mockPRs = [
        {
          number: 1,
          title: 'PR 1',
          headRefName: 'feature-1',
          isDraft: false,
          author: { login: 'user1' },
        },
        {
          number: 2,
          title: 'PR 2',
          headRefName: 'feature-2',
          isDraft: false,
          author: { login: 'user2' },
        },
      ];
      (listOpenPRs as jest.MockedFunction<typeof listOpenPRs>).mockResolvedValueOnce(mockPRs);

      // Mock selected PRs
      mockCheckbox.mockResolvedValueOnce([mockPRs[0]]);

      // Mock successful merge
      (mergePR as jest.MockedFunction<typeof mergePR>).mockResolvedValueOnce(true);

      await curator.curateBranch('staging', 'main', false, false, false, mockLogger, mockExecAsync);

      expect(resetBranch).toHaveBeenCalledWith('staging', 'main', false, mockLogger, mockExecAsync);
      expect(mergePR).toHaveBeenCalledWith('feature-1', false, mockLogger, mockExecAsync);
      expect(mockLogger.task).toHaveBeenCalledWith('Merge #1');
      expect(mockTaskObj.complete).toHaveBeenCalled();
      expect(mockExecAsync).not.toHaveBeenCalled(); // Auto push is false
    });

    it('should handle skipped PRs', async () => {
      // Mock PRs list
      const mockPRs = [
        {
          number: 1,
          title: 'PR 1',
          headRefName: 'feature-1',
          isDraft: false,
          author: { login: 'user1' },
        },
      ];
      (listOpenPRs as jest.MockedFunction<typeof listOpenPRs>).mockResolvedValueOnce(mockPRs);

      // Mock selected PRs
      mockCheckbox.mockResolvedValueOnce(mockPRs);

      // Mock skipped merge
      (mergePR as jest.MockedFunction<typeof mergePR>).mockResolvedValueOnce(false);

      await curator.curateBranch('staging', 'main', false, false, false, mockLogger, mockExecAsync);

      expect(mergePR).toHaveBeenCalledWith('feature-1', false, mockLogger, mockExecAsync);
      expect(mockLogger.info).toHaveBeenCalledWith('Skipped #1');
    });

    it('should handle aborted process', async () => {
      // Mock PRs list
      const mockPRs = [
        {
          number: 1,
          title: 'PR 1',
          headRefName: 'feature-1',
          isDraft: false,
          author: { login: 'user1' },
        },
      ];
      (listOpenPRs as jest.MockedFunction<typeof listOpenPRs>).mockResolvedValueOnce(mockPRs);

      // Mock selected PRs
      mockCheckbox.mockResolvedValueOnce(mockPRs);

      // Mock aborted merge
      (mergePR as jest.MockedFunction<typeof mergePR>).mockResolvedValueOnce({ aborted: true });

      await curator.curateBranch('staging', 'main', false, false, false, mockLogger, mockExecAsync);

      expect(mergePR).toHaveBeenCalledWith('feature-1', false, mockLogger, mockExecAsync);
      expect(mockLogger.info).toHaveBeenCalledWith('Process aborted by user');
      // Should return early without pushing
      expect(mockExecAsync).not.toHaveBeenCalled();
    });

    it('should auto push when enabled', async () => {
      // Mock PRs list
      const mockPRs = [
        {
          number: 1,
          title: 'PR 1',
          headRefName: 'feature-1',
          isDraft: false,
          author: { login: 'user1' },
        },
      ];
      (listOpenPRs as jest.MockedFunction<typeof listOpenPRs>).mockResolvedValueOnce(mockPRs);

      // Mock selected PRs
      mockCheckbox.mockResolvedValueOnce(mockPRs);

      // Mock successful merge
      (mergePR as jest.MockedFunction<typeof mergePR>).mockResolvedValueOnce(true);

      await curator.curateBranch('staging', 'main', false, false, true, mockLogger, mockExecAsync);

      expect(mockExecAsync).toHaveBeenCalledWith('git push origin staging');
      expect(mockLogger.task).toHaveBeenCalledWith('Push staging');
      expect(mockTaskObj.complete).toHaveBeenCalled();
    });
  });
});
