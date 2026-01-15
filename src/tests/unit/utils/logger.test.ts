// Mock winston before importing logger
jest.mock('winston', () => {
  const mFormat = {
    combine: jest.fn(() => 'combined-format'),
    timestamp: jest.fn(() => 'timestamp-format'),
    colorize: jest.fn(() => 'colorize-format'),
    printf: jest.fn(() => 'printf-format'),
    uncolorize: jest.fn(() => 'uncolorize-format'),
  };
  const mTransports = {
    Console: jest.fn(),
    File: jest.fn(),
  };
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    debug: jest.fn(),
  };

  return {
    format: mFormat,
    transports: mTransports,
    createLogger: jest.fn(() => mockLogger),
    addColors: jest.fn(),
  };
});

// Mock the env module
jest.mock('../../../config/env', () => ({
  env: {
    LOG_LEVEL: 'debug',
  },
}));

describe('Logger', () => {
  let logger: any;

  beforeAll(() => {
    // Import after all mocks are set up
    const loggerModule = require('../../../utils/logger');
    logger = loggerModule.logger;
  });

  describe('Logger instance', () => {
    it('should export a logger instance', () => {
      expect(logger).toBeDefined();
    });

    it('should have error logging method', () => {
      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe('function');
    });

    it('should have warn logging method', () => {
      expect(logger.warn).toBeDefined();
      expect(typeof logger.warn).toBe('function');
    });

    it('should have info logging method', () => {
      expect(logger.info).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should have http logging method', () => {
      expect(logger.http).toBeDefined();
      expect(typeof logger.http).toBeDefined();
    });

    it('should have debug logging method', () => {
      expect(logger.debug).toBeDefined();
      expect(typeof logger.debug).toBe('function');
    });

    it('should have all required logging methods', () => {
      const methods = ['error', 'warn', 'info', 'http', 'debug'];
      methods.forEach((method) => {
        expect(logger[method]).toBeDefined();
        expect(typeof logger[method]).toBe('function');
      });
    });
  });

  describe('Logging functionality', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call error method with message', () => {
      logger.error('Error message');
      expect(logger.error).toHaveBeenCalledWith('Error message');
    });

    it('should call warn method with message', () => {
      logger.warn('Warning message');
      expect(logger.warn).toHaveBeenCalledWith('Warning message');
    });

    it('should call info method with message', () => {
      logger.info('Info message');
      expect(logger.info).toHaveBeenCalledWith('Info message');
    });

    it('should call http method with message', () => {
      logger.http('HTTP message');
      expect(logger.http).toHaveBeenCalledWith('HTTP message');
    });

    it('should call debug method with message', () => {
      logger.debug('Debug message');
      expect(logger.debug).toHaveBeenCalledWith('Debug message');
    });

    it('should handle multiple log calls', () => {
      logger.error('Error 1');
      logger.warn('Warn 1');
      logger.info('Info 1');

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledTimes(1);
    });

    it('should handle logging with objects', () => {
      const errorObject = { message: 'Error', code: 500 };
      logger.error('Error occurred', errorObject);

      expect(logger.error).toHaveBeenCalledWith('Error occurred', errorObject);
    });

    it('should support all log levels', () => {
      const levels = ['error', 'warn', 'info', 'http', 'debug'];

      levels.forEach((level, index) => {
        logger[level](`Test ${level} message`);
        expect(logger[level]).toHaveBeenCalledWith(`Test ${level} message`);
      });
    });
  });
});
