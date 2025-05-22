import { Spinner } from 'cli-spinner';

export interface Logger {
  info: (message: string) => void;
  error: (message: string, error?: unknown) => void;
  progress: (message: string) => void;
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

  return {
    info: (message: string) => {
      if (verbose) {
        console.log(message);
      }
    },
    error: (message: string, error?: unknown) => {
      stopSpinner();
      console.error(`✖ ${message}`, error ? error : '');
    },
    progress: (message: string) => {
      stopSpinner();
      spinner = new Spinner({
        text: message,
      });
      spinner.setSpinnerString(20);
      spinner.start();
    },
    complete: (message: string) => {
      stopSpinner();
      console.log(`✅ ${message}`);
    }
  };
} 