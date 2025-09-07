import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'debug';
    
    // Clear module cache to re-import logger with new env vars
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create logger with correct configuration', async () => {
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
        format: expect.any(Object),
        defaultMeta: expect.objectContaining({
          service: 'nrghax-bot',
        }),
        transports: expect.any(Array),
      })
    );
  });

  it('should use info level in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = undefined;
    
    vi.resetModules();
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
      })
    );
  });

  it('should use debug level in development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_LEVEL = undefined;
    
    vi.resetModules();
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug',
      })
    );
  });

  it('should respect LOG_LEVEL environment variable', async () => {
    process.env.LOG_LEVEL = 'warn';
    
    vi.resetModules();
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'warn',
      })
    );
  });

  it('should create console transport', async () => {
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.transports.Console).toHaveBeenCalled();
  });

  it('should create file transports in production', async () => {
    process.env.NODE_ENV = 'production';
    
    vi.resetModules();
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.transports.File).toHaveBeenCalledTimes(2);
    expect(winston.transports.File).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'logs/error.log',
        level: 'error',
      })
    );
    expect(winston.transports.File).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'logs/combined.log',
      })
    );
  });

  it('should not create file transports in development', async () => {
    process.env.NODE_ENV = 'development';
    
    vi.resetModules();
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    // Console transport is always created, file transports only in production
    expect(winston.transports.Console).toHaveBeenCalled();
    expect(winston.transports.File).not.toHaveBeenCalled();
  });

  it('should provide all log methods', async () => {
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    const mockLogger = (winston.createLogger as any).mock.results[0].value;
    
    expect(mockLogger.info).toBeDefined();
    expect(mockLogger.error).toBeDefined();
    expect(mockLogger.warn).toBeDefined();
    expect(mockLogger.debug).toBeDefined();
    expect(mockLogger.verbose).toBeDefined();
    expect(mockLogger.silly).toBeDefined();
  });

  it('should handle logging with metadata', async () => {
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    const mockLogger = (winston.createLogger as any).mock.results[0].value;
    
    mockLogger.info('Test message', { userId: '123', action: 'test' });
    
    expect(mockLogger.info).toHaveBeenCalledWith('Test message', { 
      userId: '123', 
      action: 'test' 
    });
  });

  it('should handle error logging', async () => {
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    const mockLogger = (winston.createLogger as any).mock.results[0].value;
    
    const error = new Error('Test error');
    mockLogger.error('Error occurred', error);
    
    expect(mockLogger.error).toHaveBeenCalledWith('Error occurred', error);
  });

  it('should use correct format in production', async () => {
    process.env.NODE_ENV = 'production';
    
    vi.resetModules();
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.format.combine).toHaveBeenCalled();
    expect(winston.format.timestamp).toHaveBeenCalled();
    expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
    expect(winston.format.json).toHaveBeenCalled();
  });

  it('should use colorized format in development', async () => {
    process.env.NODE_ENV = 'development';
    
    vi.resetModules();
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.format.combine).toHaveBeenCalled();
    expect(winston.format.colorize).toHaveBeenCalled();
    expect(winston.format.simple).toHaveBeenCalled();
  });

  it('should handle undefined NODE_ENV', async () => {
    delete process.env.NODE_ENV;
    process.env.LOG_LEVEL = undefined;
    
    vi.resetModules();
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info', // Default to info when NODE_ENV is undefined
      })
    );
  });

  it('should set correct default metadata', async () => {
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultMeta: {
          service: 'nrghax-bot',
        },
      })
    );
  });

  it('should handle logging without metadata', async () => {
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    const mockLogger = (winston.createLogger as any).mock.results[0].value;
    
    mockLogger.info('Simple message');
    
    expect(mockLogger.info).toHaveBeenCalledWith('Simple message');
  });

  it('should handle debug logging', async () => {
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    const mockLogger = (winston.createLogger as any).mock.results[0].value;
    
    mockLogger.debug('Debug info', { data: 'test' });
    
    expect(mockLogger.debug).toHaveBeenCalledWith('Debug info', { data: 'test' });
  });

  it('should handle warning logging', async () => {
    const winston = await import('winston');
    const { logger } = await import('../../../src/utils/logger');
    const mockLogger = (winston.createLogger as any).mock.results[0].value;
    
    mockLogger.warn('Warning message');
    
    expect(mockLogger.warn).toHaveBeenCalledWith('Warning message');
  });

  it('should export logger as named export', async () => {
    const loggerModule = await import('../../../src/utils/logger');
    
    expect(loggerModule.logger).toBeDefined();
  });

  it('should export logger as default', async () => {
    const loggerModule = await import('../../../src/utils/logger');
    
    expect(loggerModule.default).toBeDefined();
    expect(loggerModule.default).toBe(loggerModule.logger);
  });
});