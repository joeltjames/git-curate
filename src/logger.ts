import { Spinner } from 'cli-spinner';

export interface CompletableTask {
  complete: () => void;
  completeWithMessage: (message: string) => void;
  fail: (error?: unknown) => void;
}

export interface Logger {
  info: (message: string) => void;
  error: (message: string, error?: unknown) => void;
  task: (message: string) => CompletableTask;
  complete: (message: string) => void;
}

export function configureLogger(verbose: boolean): Logger {
  let spinner: Spinner | null = null;

  const stopSpinner = () => {
    if (spinner) {
      spinner.stop(true);
      spinner = null;
    }
  };

  const logger: Logger = {
    info: (message: string) => {
      if (verbose) {
        console.log(message);
      }
    },
    error: (message: string, error?: unknown) => {
      stopSpinner();
      console.error(`✖ ${message}`, error ? error : '');
    },
    task: (message: string): CompletableTask => {
      stopSpinner();
      spinner = new Spinner({
        text: message,
      });
      spinner.setSpinnerString(20);
      spinner.start();

      return {
        complete: () => {
          stopSpinner();
          console.log(`✅ ${message}`);
        },
        completeWithMessage: (newMessage: string) => {
          stopSpinner();
          console.log(`✅ ${newMessage}`);
        },
        fail: (error?: unknown) => {
          stopSpinner();
          console.error(`✖ ${message}`, error ? error : '');
        },
      };
    },
    complete: (message: string) => {
      stopSpinner();
      console.log(`✅ ${message}`);
    },
  };

  return logger;
}
