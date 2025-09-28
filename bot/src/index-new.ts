import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { CommandManager } from './core/CommandManager';
import { DiscordClient } from './platforms/discord/DiscordClient';
import { SlackClient } from './platforms/slack/SlackClient';
import { ErrorService } from './services/errorService';
import { RoleSyncService } from './services/roleSyncService';
import { TagSyncService } from './services/tagSyncService';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
];

// Check for either new secret key or legacy service role key
if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Missing required Supabase admin key (SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Platform-specific validation
const enableDiscord = process.env.ENABLE_DISCORD !== 'false';
const enableSlack = process.env.ENABLE_SLACK === 'true';

if (enableDiscord) {
  const discordVars = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
  for (const envVar of discordVars) {
    if (!process.env[envVar]) {
      logger.error(`Missing required Discord environment variable: ${envVar}`);
      process.exit(1);
    }
  }
}

if (enableSlack) {
  const slackVars = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'SLACK_APP_TOKEN'];
  for (const envVar of slackVars) {
    if (!process.env[envVar]) {
      logger.error(`Missing required Slack environment variable: ${envVar}`);
      process.exit(1);
    }
  }
}

class UnifiedBot {
  private commandManager: CommandManager;
  private discordClient?: DiscordClient;
  private slackClient?: SlackClient;
  private errorService?: ErrorService;
  private roleSyncService?: RoleSyncService;
  private tagSyncService?: TagSyncService;

  constructor() {
    this.commandManager = new CommandManager();
  }

  async start(): Promise<void> {
    logger.info('🚀 Starting NRGHax Unified Bot...');

    try {
      // Initialize platforms
      if (enableDiscord) {
        await this.initializeDiscord();
      }

      if (enableSlack) {
        await this.initializeSlack();
      }

      if (!enableDiscord && !enableSlack) {
        throw new Error('At least one platform must be enabled');
      }

      // Deploy commands to all platforms
      await this.commandManager.deployCommands();

      // Initialize shared services
      await this.initializeServices();

      logger.info('✅ NRGHax Unified Bot is fully operational!');
      logger.info(`📊 Active platforms: ${[
        enableDiscord ? 'Discord' : null,
        enableSlack ? 'Slack' : null,
      ].filter(Boolean).join(', ')}`);

    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  private async initializeDiscord(): Promise<void> {
    logger.info('🟦 Initializing Discord platform...');

    this.discordClient = new DiscordClient();
    this.commandManager.addPlatform(this.discordClient);

    await this.discordClient.start();

    logger.info('✅ Discord platform ready');
  }

  private async initializeSlack(): Promise<void> {
    logger.info('🟩 Initializing Slack platform...');

    this.slackClient = new SlackClient();
    this.commandManager.addPlatform(this.slackClient);

    await this.slackClient.start();

    logger.info('✅ Slack platform ready');
  }

  private async initializeServices(): Promise<void> {
    logger.info('⚙️ Initializing shared services...');

    // Initialize error service - use Discord client if available, otherwise null
    const discordClientForServices = this.discordClient?.getDiscordClient ?
      this.discordClient.getDiscordClient() : null;

    if (discordClientForServices) {
      this.errorService = new ErrorService(discordClientForServices);
      this.roleSyncService = new RoleSyncService(discordClientForServices);
      this.tagSyncService = new TagSyncService(discordClientForServices);

      // Start role sync if Discord is enabled
      this.roleSyncService.startPeriodicSync();

      // Initialize tag sync service
      await this.tagSyncService.initialize();

      // Ensure NRG roles exist in all Discord guilds
      const client = discordClientForServices;
      for (const [guildId, guild] of client.guilds.cache) {
        try {
          await this.roleSyncService.ensureNRGRoles(guild);
        } catch (error) {
          logger.error(`Failed to ensure roles in guild ${guildId}:`, error);
        }
      }

      logger.info('✅ Discord-specific services initialized');
    } else {
      logger.info('ℹ️ Discord-specific services skipped (Discord not enabled)');
    }

    logger.info('✅ All services initialized');
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      // Stop services
      if (this.roleSyncService) {
        this.roleSyncService.stopPeriodicSync();
      }
      if (this.tagSyncService) {
        this.tagSyncService.stopPeriodicSync();
      }

      // Stop platforms
      if (this.discordClient) {
        await this.discordClient.stop();
      }
      if (this.slackClient) {
        await this.slackClient.stop();
      }

      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught exceptions
    process.on('unhandledRejection', (reason, promise) => {
      if (this.errorService) {
        this.errorService.handleUnhandledRejection(reason, promise);
      } else {
        logger.error('Unhandled Rejection:', reason);
      }
    });

    process.on('uncaughtException', (error) => {
      if (this.errorService) {
        this.errorService.handleUncaughtException(error);
      } else {
        logger.error('Uncaught Exception:', error);
      }

      // Give time for error to be logged before exiting
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  }

  // Health check method for status monitoring
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    platforms: Record<string, boolean>;
    services: Record<string, any>;
  }> {
    const platforms: Record<string, boolean> = {};
    const services: Record<string, any> = {};

    // Check platform health
    if (this.discordClient) {
      platforms.discord = this.discordClient.isReady();
    }
    if (this.slackClient) {
      platforms.slack = this.slackClient.isReady();
    }

    // Check service health
    if (this.tagSyncService) {
      services.tagSync = await this.tagSyncService.healthCheck();
    }

    const allPlatformsHealthy = Object.values(platforms).every(Boolean);
    const status = allPlatformsHealthy ? 'healthy' : 'degraded';

    return {
      status,
      platforms,
      services,
    };
  }
}

// Create and start the bot
const bot = new UnifiedBot();

// Set up graceful shutdown
bot['setupGracefulShutdown']();

// Health check endpoint for monitoring
setInterval(async () => {
  try {
    const health = await bot.getHealthStatus();
    if (health.status !== 'healthy') {
      logger.warn('Bot health check failed:', health);
    }
  } catch (error) {
    logger.error('Health check error:', error);
  }
}, 60000); // Check every minute

// Start the bot
bot.start().catch(error => {
  logger.error('Failed to start bot:', error);
  process.exit(1);
});