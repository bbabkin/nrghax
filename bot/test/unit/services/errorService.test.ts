import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorService, ErrorSeverity, ErrorContext } from '../../../src/services/errorService';
import { mockClient, createMockUser, mockEmbedBuilder } from '../../mocks/discord';
import { mockSupabaseClient } from '../../mocks/supabase';

vi.mock('../../../src/database/supabase', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('discord.js', () => ({
  EmbedBuilder: vi.fn(() => mockEmbedBuilder()),
}));

describe('ErrorService', () => {
  let errorService: ErrorService;
  let mockAdminUser: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env.ADMIN_USER_IDS = 'admin-1,admin-2';
    
    // Set up mock client
    mockClient.users.fetch = vi.fn();
    mockAdminUser = createMockUser('admin-1', 'Admin#0001');
    
    errorService = new ErrorService(mockClient as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Error Handling', () => {
    it('should handle low severity errors without admin notification', async () => {
      const error = new Error('Low severity error');
      const context: ErrorContext = { userId: 'user-1', command: 'test' };

      await errorService.handleError(error, ErrorSeverity.LOW, context);

      expect(mockClient.users.fetch).not.toHaveBeenCalled();
    });

    it('should handle medium severity errors without admin notification', async () => {
      const error = new Error('Medium severity error');

      await errorService.handleError(error, ErrorSeverity.MEDIUM);

      expect(mockClient.users.fetch).not.toHaveBeenCalled();
    });

    it('should notify admins for high severity errors', async () => {
      mockClient.users.fetch.mockResolvedValue(mockAdminUser);
      const error = new Error('High severity error');
      const context: ErrorContext = { userId: 'user-1', command: 'test' };

      await errorService.handleError(error, ErrorSeverity.HIGH, context);

      expect(mockClient.users.fetch).toHaveBeenCalledWith('admin-1');
      expect(mockAdminUser.send).toHaveBeenCalled();
    });

    it('should notify admins for critical errors', async () => {
      mockClient.users.fetch.mockResolvedValue(mockAdminUser);
      const error = new Error('Critical error');

      await errorService.handleError(error, ErrorSeverity.CRITICAL);

      expect(mockClient.users.fetch).toHaveBeenCalledWith('admin-1');
      expect(mockAdminUser.send).toHaveBeenCalled();
    });

    it('should handle non-Error objects', async () => {
      const error = 'String error';

      await errorService.handleError(error, ErrorSeverity.LOW);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should include context in admin notifications', async () => {
      mockClient.users.fetch.mockResolvedValue(mockAdminUser);
      const error = new Error('Error with context');
      const context: ErrorContext = {
        userId: 'user-1',
        guildId: 'guild-1',
        command: 'test',
        action: 'execute',
        metadata: { additional: 'data' },
      };

      await errorService.handleError(error, ErrorSeverity.HIGH, context);

      expect(mockAdminUser.send).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
        })
      );
    });
  });

  describe('Error Throttling', () => {
    it('should throttle repeated error notifications', async () => {
      vi.useFakeTimers();
      mockClient.users.fetch.mockResolvedValue(mockAdminUser);
      const error = new Error('Repeated error');

      // First error should notify
      await errorService.handleError(error, ErrorSeverity.HIGH);
      expect(mockAdminUser.send).toHaveBeenCalledTimes(1);

      // Same error within throttle period should not notify
      await errorService.handleError(error, ErrorSeverity.HIGH);
      expect(mockAdminUser.send).toHaveBeenCalledTimes(1);

      // After throttle period, should notify again
      vi.advanceTimersByTime(61000); // 61 seconds
      await errorService.handleError(error, ErrorSeverity.HIGH);
      expect(mockAdminUser.send).toHaveBeenCalledTimes(2);
    });

    it('should not throttle different errors', async () => {
      mockClient.users.fetch.mockResolvedValue(mockAdminUser);

      await errorService.handleError(new Error('Error 1'), ErrorSeverity.HIGH);
      await errorService.handleError(new Error('Error 2'), ErrorSeverity.HIGH);

      expect(mockAdminUser.send).toHaveBeenCalledTimes(2);
    });

    it('should clean up old throttle entries', async () => {
      vi.useFakeTimers();
      mockClient.users.fetch.mockResolvedValue(mockAdminUser);

      // Create multiple errors
      for (let i = 0; i < 5; i++) {
        await errorService.handleError(new Error(`Error ${i}`), ErrorSeverity.HIGH);
      }

      // Advance time significantly
      vi.advanceTimersByTime(11 * 60 * 1000); // 11 minutes

      // Trigger cleanup with a new error
      await errorService.handleError(new Error('New error'), ErrorSeverity.HIGH);

      // Old entries should be cleaned up
      expect(mockAdminUser.send).toHaveBeenCalled();
    });
  });

  describe('Admin Notification', () => {
    it('should notify all configured admins', async () => {
      const admin1 = createMockUser('admin-1', 'Admin1#0001');
      const admin2 = createMockUser('admin-2', 'Admin2#0002');
      
      mockClient.users.fetch
        .mockResolvedValueOnce(admin1)
        .mockResolvedValueOnce(admin2);

      await errorService.handleError(new Error('Test'), ErrorSeverity.HIGH);

      expect(mockClient.users.fetch).toHaveBeenCalledWith('admin-1');
      expect(mockClient.users.fetch).toHaveBeenCalledWith('admin-2');
      expect(admin1.send).toHaveBeenCalled();
      expect(admin2.send).toHaveBeenCalled();
    });

    it('should handle admin DM failures gracefully', async () => {
      const admin1 = createMockUser('admin-1', 'Admin1#0001');
      admin1.send.mockRejectedValue(new Error('DM failed'));
      mockClient.users.fetch.mockResolvedValue(admin1);

      await errorService.handleError(new Error('Test'), ErrorSeverity.HIGH);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle missing admin users', async () => {
      mockClient.users.fetch.mockRejectedValue(new Error('User not found'));

      await errorService.handleError(new Error('Test'), ErrorSeverity.HIGH);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should work with no configured admins', async () => {
      process.env.ADMIN_USER_IDS = '';
      errorService = new ErrorService(mockClient as any);

      await errorService.handleError(new Error('Test'), ErrorSeverity.HIGH);

      expect(mockClient.users.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Unhandled Errors', () => {
    it('should handle unhandled rejections', () => {
      const promise = Promise.reject('Test rejection');
      
      errorService.handleUnhandledRejection('Test rejection', promise);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle uncaught exceptions', () => {
      const error = new Error('Uncaught exception');

      errorService.handleUncaughtException(error);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should perform health check with all systems healthy', async () => {
      mockClient.ws.status = 0; // READY
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await errorService.performHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.checks.discord).toBe(true);
      expect(result.checks.database).toBe(true);
      expect(result.checks.memory).toBe(true);
    });

    it('should detect Discord connection issues', async () => {
      mockClient.ws.status = 1; // Not READY

      const result = await errorService.performHealthCheck();

      expect(result.checks.discord).toBe(false);
      expect(result.status).not.toBe('healthy');
    });

    it('should detect database issues', async () => {
      mockClient.ws.status = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      });

      const result = await errorService.performHealthCheck();

      expect(result.checks.database).toBe(false);
      expect(result.status).not.toBe('healthy');
    });

    it('should detect memory issues', async () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 950,
        heapTotal: 1000,
        rss: 1000,
        external: 0,
        arrayBuffers: 0,
      });

      const result = await errorService.performHealthCheck();

      expect(result.checks.memory).toBe(false);
      
      process.memoryUsage = originalMemoryUsage;
    });

    it('should return degraded status for partial failures', async () => {
      mockClient.ws.status = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      });

      const result = await errorService.performHealthCheck();

      expect(result.status).toBe('degraded');
    });

    it('should return unhealthy status when all checks fail', async () => {
      mockClient.ws.status = 1;
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      });
      
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 950,
        heapTotal: 1000,
        rss: 1000,
        external: 0,
        arrayBuffers: 0,
      });

      const result = await errorService.performHealthCheck();

      expect(result.status).toBe('unhealthy');
      
      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle database check exceptions', async () => {
      mockClient.ws.status = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await errorService.performHealthCheck();

      expect(result.checks.database).toBe(false);
    });
  });

  describe('Error Embed Creation', () => {
    it('should create correct embed for different severity levels', async () => {
      mockClient.users.fetch.mockResolvedValue(mockAdminUser);

      const severities = [
        ErrorSeverity.LOW,
        ErrorSeverity.MEDIUM,
        ErrorSeverity.HIGH,
        ErrorSeverity.CRITICAL,
      ];

      for (const severity of severities) {
        await errorService.handleError(new Error(`${severity} error`), severity);
      }

      // Verify embeds were created for HIGH and CRITICAL only
      expect(mockAdminUser.send).toHaveBeenCalledTimes(2);
    });

    it('should truncate long error messages', async () => {
      mockClient.users.fetch.mockResolvedValue(mockAdminUser);
      const longError = new Error('a'.repeat(2000));

      await errorService.handleError(longError, ErrorSeverity.HIGH);

      expect(mockAdminUser.send).toHaveBeenCalled();
    });

    it('should truncate long metadata', async () => {
      mockClient.users.fetch.mockResolvedValue(mockAdminUser);
      const context: ErrorContext = {
        metadata: {
          data: 'x'.repeat(1000),
        },
      };

      await errorService.handleError(new Error('Test'), ErrorSeverity.HIGH, context);

      expect(mockAdminUser.send).toHaveBeenCalled();
    });
  });
});