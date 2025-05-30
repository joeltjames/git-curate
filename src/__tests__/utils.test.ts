import { jest } from '@jest/globals';
import { execAsync } from '../utils';

// Mock modules
jest.mock('child_process');
jest.mock('util');

describe('Utils Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('execAsync', () => {
    it('should execute command and return stdout and stderr', async () => {
      const mockExec = jest
        .fn<typeof execAsync>()
        .mockResolvedValue({ stdout: 'test output', stderr: '' });
      const mockPromisify = jest.fn().mockReturnValue(mockExec);
      const util = await import('util');
      jest.spyOn(util, 'promisify').mockImplementation(mockPromisify);

      const result = await execAsync('test command');

      expect(result).toEqual({ stdout: 'test output', stderr: '' });
      expect(mockExec).toHaveBeenCalledWith('test command');
    });

    it('should handle command errors', async () => {
      const testError = new Error('Command failed');
      const mockExec = jest.fn<typeof execAsync>().mockRejectedValue(testError);
      const mockPromisify = jest.fn().mockReturnValue(mockExec);
      const util = await import('util');
      jest.spyOn(util, 'promisify').mockImplementation(mockPromisify);

      await expect(execAsync('test command')).rejects.toThrow(testError);
    });
  });
});
