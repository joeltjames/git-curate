import type { Logger, _CompletableTask } from '../logger';
import { jest } from '@jest/globals';

// Mock modules that are used in tests
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('util', () => ({
  promisify: jest.fn(() => jest.fn()),
}));

jest.mock('readline', () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((_, cb: (answer: string) => void) => setTimeout(() => cb(''), 0)),
    close: jest.fn(),
  }),
}));

jest.mock('@inquirer/prompts', () => ({
  checkbox: jest.fn(),
  select: jest.fn(),
}));

// Create a reusable mock logger
export const createMockLogger = (): Logger =>
  ({
    info: jest.fn(),
    error: jest.fn(),
    complete: jest.fn(),
    task: jest.fn().mockImplementation(() => ({
      complete: jest.fn(),
      completeWithMessage: jest.fn(),
      fail: jest.fn(),
    })),
  }) as unknown as Logger;
