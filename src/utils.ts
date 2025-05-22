import { exec } from 'child_process';
import { promisify } from 'util';

/**
 * Type definition for executable commands
 */
export type ExecFunction = (command: string) => Promise<{ stdout: string; stderr: string }>;

/**
 * Default implementation of ExecFunction using node's child_process.exec
 */
export const execAsync: ExecFunction = async (command: string) => {
  const execFn = promisify(exec);
  return execFn(command);
};