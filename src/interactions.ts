import { select as inquirerSelect, checkbox as inquirerCheckbox } from '@inquirer/prompts';
import { Separator } from '@inquirer/checkbox';
import * as readline from 'readline';

/**
 * Type for selection prompts
 */
export type SelectFunction = <T extends string>(options: { 
  message: string; 
  choices: Array<{ name: string; value: T; description: string }> 
}) => Promise<T>;

/**
 * Type for checkbox selection prompts
 */
export type CheckboxFunction = <T>(options: {
  message: string;
  instructions?: string | boolean;
  pageSize?: number;
  loop?: boolean;
  prefix?: string;
  validate?: (items: Array<Separator | { name?: string; value: T; disabled?: boolean | string; checked?: boolean }>) => boolean | string | Promise<boolean | string>;
  choices: Array<{ name: string; value: T }>;
}) => Promise<T[]>;

/**
 * Type for waiting for user input
 */
export type WaitForEnterFunction = () => Promise<void>;

/**
 * Default implementation for selection using inquirer
 */
export const selectPrompt: SelectFunction = inquirerSelect;

/**
 * Default implementation for checkbox selection using inquirer
 */
export const checkboxPrompt: CheckboxFunction = inquirerCheckbox as unknown as CheckboxFunction;

/**
 * Default implementation for waiting for Enter key
 */
export const waitForEnter: WaitForEnterFunction = (): Promise<void> => {
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
};