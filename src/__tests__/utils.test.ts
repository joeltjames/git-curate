import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { execAsync } from '../utils';
import type { ExecFunction } from '../utils';

// Mock modules
jest.mock('child_process');
jest.mock('util');

describe('Utils Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('execAsync', () => {
    it('should execute command and return stdout and stderr', async () => {
      const execResult = { stdout: 'test output', stderr: '' };
      const mockExec = jest.fn<ExecFunction>().mockResolvedValue(execResult);

      // Mock the util.promisify function
      const util = await import('util');
      jest.spyOn(util, 'promisify').mockReturnValue(mockExec);

      const result = await execAsync('test command');

      expect(result).toEqual(execResult);
      expect(mockExec).toHaveBeenCalledWith('test command');
    });

    it('should handle command errors', async () => {
      const testError = new Error('Command failed');
      const mockExec = jest.fn<ExecFunction>().mockRejectedValue(testError);

      // Mock the util.promisify function
      const util = await import('util');
      jest.spyOn(util, 'promisify').mockReturnValue(mockExec);

      await expect(execAsync('test command')).rejects.toThrow(testError);
    });
  });
});
