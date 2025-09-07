import { Client, EmbedBuilder, User } from 'discord.js';
import { logger } from '../utils/logger';

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  userId?: string;
  guildId?: string;
  command?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class ErrorService {
  private client: Client;
  private adminUserIds: string[];
  private errorQueue: Map<string, number> = new Map();
  private readonly ERROR_THROTTLE_MS = 60000; // 1 minute

  constructor(client: Client) {
    this.client = client;
    this.adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
  }

  /**
   * Handle an error with appropriate logging and notifications
   */
  async handleError(
    error: Error | unknown,
    severity: ErrorSeverity,
    context?: ErrorContext
  ): Promise<void> {
    // Log the error
    this.logError(error, severity, context);

    // Notify admins for high severity errors
    if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
      await this.notifyAdmins(error, severity, context);
    }

    // Track error patterns
    this.trackErrorPattern(error);
  }

  /**
   * Log error with appropriate level
   */
  private logError(
    error: Error | unknown,
    severity: ErrorSeverity,
    context?: ErrorContext
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logData = {
      severity,
      message: errorMessage,
      stack: errorStack,
      ...context,
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error('Critical error occurred:', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Warning-level error:', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('Low-severity error:', logData);
        break;
    }
  }

  /**
   * Notify admin users about critical errors via DM
   */
  private async notifyAdmins(
    error: Error | unknown,
    severity: ErrorSeverity,
    context?: ErrorContext
  ): Promise<void> {
    // Check throttling
    if (!this.shouldNotifyAdmins(error)) {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const embed = this.createErrorEmbed(errorMessage, severity, context);

    for (const adminId of this.adminUserIds) {
      try {
        const admin = await this.client.users.fetch(adminId);
        if (admin) {
          await this.sendDMSafely(admin, embed);
          logger.info(`Notified admin ${admin.tag} about error`);
        }
      } catch (dmError) {
        logger.error(`Failed to notify admin ${adminId}:`, dmError);
      }
    }
  }

  /**
   * Create an error embed for admin notification
   */
  private createErrorEmbed(
    errorMessage: string,
    severity: ErrorSeverity,
    context?: ErrorContext
  ): EmbedBuilder {
    const severityColors = {
      [ErrorSeverity.LOW]: 0x3B82F6,
      [ErrorSeverity.MEDIUM]: 0xFBBF24,
      [ErrorSeverity.HIGH]: 0xF97316,
      [ErrorSeverity.CRITICAL]: 0xEF4444,
    };

    const embed = new EmbedBuilder()
      .setColor(severityColors[severity])
      .setTitle(`⚠️ ${severity} Error Alert`)
      .setDescription(`An error occurred in the NRGhax bot`)
      .addFields({
        name: 'Error Message',
        value: `\`\`\`${errorMessage.substring(0, 1000)}\`\`\``,
        inline: false,
      })
      .setTimestamp()
      .setFooter({ text: 'NRGhax Bot Error Handler' });

    if (context) {
      const contextFields = [];

      if (context.command) {
        contextFields.push({
          name: 'Command',
          value: context.command,
          inline: true,
        });
      }

      if (context.userId) {
        contextFields.push({
          name: 'User ID',
          value: context.userId,
          inline: true,
        });
      }

      if (context.guildId) {
        contextFields.push({
          name: 'Guild ID',
          value: context.guildId,
          inline: true,
        });
      }

      if (context.action) {
        contextFields.push({
          name: 'Action',
          value: context.action,
          inline: true,
        });
      }

      if (contextFields.length > 0) {
        embed.addFields(contextFields);
      }

      if (context.metadata) {
        embed.addFields({
          name: 'Additional Context',
          value: `\`\`\`json\n${JSON.stringify(context.metadata, null, 2).substring(0, 500)}\`\`\``,
          inline: false,
        });
      }
    }

    return embed;
  }

  /**
   * Send DM safely with fallback
   */
  private async sendDMSafely(user: User, embed: EmbedBuilder): Promise<void> {
    try {
      await user.send({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to send DM to user ${user.tag}:`, error);
    }
  }

  /**
   * Check if we should notify admins (throttling)
   */
  private shouldNotifyAdmins(error: Error | unknown): boolean {
    const errorKey = error instanceof Error ? error.message : String(error);
    const now = Date.now();
    const lastNotified = this.errorQueue.get(errorKey);

    if (lastNotified && now - lastNotified < this.ERROR_THROTTLE_MS) {
      return false;
    }

    this.errorQueue.set(errorKey, now);

    // Clean up old entries
    for (const [key, timestamp] of this.errorQueue.entries()) {
      if (now - timestamp > this.ERROR_THROTTLE_MS * 10) {
        this.errorQueue.delete(key);
      }
    }

    return true;
  }

  /**
   * Track error patterns for analysis
   */
  private trackErrorPattern(error: Error | unknown): void {
    // This could be extended to track patterns and identify recurring issues
    const errorType = error instanceof Error ? error.constructor.name : 'Unknown';
    logger.debug(`Error pattern tracked: ${errorType}`);
  }

  /**
   * Handle unhandled rejections
   */
  handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    logger.error('Unhandled Promise Rejection:', { reason, promise });
    this.handleError(
      new Error(`Unhandled Promise Rejection: ${reason}`),
      ErrorSeverity.HIGH,
      { action: 'unhandledRejection' }
    );
  }

  /**
   * Handle uncaught exceptions
   */
  handleUncaughtException(error: Error): void {
    logger.error('Uncaught Exception:', error);
    this.handleError(error, ErrorSeverity.CRITICAL, { action: 'uncaughtException' });
  }

  /**
   * Create health check for monitoring
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
  }> {
    const checks: Record<string, boolean> = {
      discord: false,
      database: false,
      memory: false,
    };

    // Check Discord connection
    checks.discord = this.client.ws.status === 0; // 0 = READY

    // Check database connection
    try {
      const { supabase } = await import('../database/supabase');
      const { error } = await supabase.from('profiles').select('count').limit(1);
      checks.database = !error;
    } catch (error) {
      checks.database = false;
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    checks.memory = heapUsedPercent < 90;

    const allHealthy = Object.values(checks).every(check => check);
    const someHealthy = Object.values(checks).some(check => check);

    return {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      checks,
    };
  }
}

export default ErrorService;