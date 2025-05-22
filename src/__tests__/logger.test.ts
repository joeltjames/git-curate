import { jest } from '@jest/globals';
import { configureLogger } from '../logger';
import { Spinner } from 'cli-spinner';

// Mock modules
jest.mock('cli-spinner');

describe('Logger Module', () => {
  let mockSpinner: jest.Mocked<Spinner>;
  let logger: ReturnType<typeof configureLogger>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock spinner
    mockSpinner = {
      stop: jest.fn(),
      start: jest.fn(),
      setSpinnerString: jest.fn()
    } as unknown as jest.Mocked<Spinner>;
    
    (Spinner as jest.MockedClass<typeof Spinner>).mockImplementation(() => mockSpinner);

    // Setup console mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('configureLogger', () => {
    describe('with verbose mode', () => {
      beforeEach(() => {
        logger = configureLogger(true);
      });

      it('should log info messages', () => {
        logger.info('Test info message');
        expect(console.log).toHaveBeenCalledWith('Test info message');
      });

      it('should log error messages with optional error', () => {
        const error = new Error('Test error');
        logger.error('Test error message', error);
        expect(console.error).toHaveBeenCalledWith('✖ Test error message', error);
      });

      it('should log error messages without error', () => {
        logger.error('Test error message');
        expect(console.error).toHaveBeenCalledWith('✖ Test error message', '');
      });

      it('should create and manage task spinner', () => {
        const task = logger.task('Test task');
        
        expect(Spinner).toHaveBeenCalledWith({ text: 'Test task' });
        expect(mockSpinner.setSpinnerString).toHaveBeenCalledWith(20);
        expect(mockSpinner.start).toHaveBeenCalled();
      });

      it('should complete task with original message', () => {
        const task = logger.task('Test task');
        task.complete();
        
        expect(mockSpinner.stop).toHaveBeenCalledWith(true);
        expect(console.log).toHaveBeenCalledWith('✅ Test task');
      });

      it('should complete task with custom message', () => {
        const task = logger.task('Test task');
        task.completeWithMessage('Custom message');
        
        expect(mockSpinner.stop).toHaveBeenCalledWith(true);
        expect(console.log).toHaveBeenCalledWith('✅ Custom message');
      });

      it('should fail task with optional error', () => {
        const task = logger.task('Test task');
        const error = new Error('Test error');
        task.fail(error);
        
        expect(mockSpinner.stop).toHaveBeenCalledWith(true);
        expect(console.error).toHaveBeenCalledWith('✖ Test task', error);
      });

      it('should fail task without error', () => {
        const task = logger.task('Test task');
        task.fail();
        
        expect(mockSpinner.stop).toHaveBeenCalledWith(true);
        expect(console.error).toHaveBeenCalledWith('✖ Test task', '');
      });

      it('should log complete messages', () => {
        logger.complete('Test complete message');
        expect(console.log).toHaveBeenCalledWith('✅ Test complete message');
      });
    });

    describe('without verbose mode', () => {
      beforeEach(() => {
        logger = configureLogger(false);
      });

      it('should not log info messages', () => {
        logger.info('Test info message');
        expect(console.log).not.toHaveBeenCalled();
      });

      it('should still log error messages', () => {
        logger.error('Test error message');
        expect(console.error).toHaveBeenCalledWith('✖ Test error message', '');
      });

      it('should still create and manage task spinner', () => {
        const task = logger.task('Test task');
        expect(Spinner).toHaveBeenCalledWith({ text: 'Test task' });
      });
    });
  });
}); 