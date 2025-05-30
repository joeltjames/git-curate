import { jest } from '@jest/globals';
import { selectPrompt, checkboxPrompt, waitForEnter } from '../interactions';

// Mock modules
jest.mock('@inquirer/prompts');
jest.mock('readline');

describe('Interactions Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('selectPrompt', () => {
    it('should call inquirer select with correct options', async () => {
      const mockSelect = jest.fn();
      const inquirer = await import('@inquirer/prompts');
      jest.spyOn(inquirer, 'select').mockImplementation(mockSelect);

      const options = {
        message: 'Test message',
        choices: [
          { name: 'Option 1', value: 'opt1', description: 'Description 1' },
          { name: 'Option 2', value: 'opt2', description: 'Description 2' },
        ],
      };

      await selectPrompt(options);

      expect(mockSelect).toHaveBeenCalledWith(options);
    });
  });

  describe('checkboxPrompt', () => {
    it('should call inquirer checkbox with correct options', async () => {
      const mockCheckbox = jest.fn();
      const inquirer = await import('@inquirer/prompts');
      jest.spyOn(inquirer, 'checkbox').mockImplementation(mockCheckbox);

      const options = {
        message: 'Test message',
        choices: [
          { name: 'Option 1', value: 'opt1' },
          { name: 'Option 2', value: 'opt2' },
        ],
      };

      await checkboxPrompt(options);

      expect(mockCheckbox).toHaveBeenCalledWith(options);
    });

    it('should handle validation function', async () => {
      const mockCheckbox = jest.fn();
      const inquirer = await import('@inquirer/prompts');
      jest.spyOn(inquirer, 'checkbox').mockImplementation(mockCheckbox);

      const options = {
        message: 'Test message',
        choices: [
          { name: 'Option 1', value: 'opt1' },
          { name: 'Option 2', value: 'opt2' },
        ],
        validate: () => true,
      };

      await checkboxPrompt(options);

      expect(mockCheckbox).toHaveBeenCalledWith(
        expect.objectContaining({
          validate: expect.any(Function),
        })
      );
    });
  });

  describe('waitForEnter', () => {
    it('should create readline interface and wait for input', async () => {
      const mockQuestion = jest.fn((_: string, callback: () => void) => callback());
      const mockClose = jest.fn();
      const mockCreateInterface = jest.fn().mockReturnValue({
        question: mockQuestion,
        close: mockClose,
      });

      const readline = await import('readline');
      jest.spyOn(readline, 'createInterface').mockImplementation(mockCreateInterface);

      await waitForEnter();

      expect(mockCreateInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      });
      expect(mockQuestion).toHaveBeenCalledWith('', expect.any(Function));
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
