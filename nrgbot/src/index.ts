import { Client, GatewayIntentBits, Events, ActivityType } from 'discord.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { CommandHandler } from './handlers/commandHandler';
import { ErrorService, ErrorSeverity } from './services/errorService';
import { RoleSyncService } from './services/roleSyncService';
import { TagSyncService } from './services/tagSyncService';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    // GatewayIntentBits.GuildMembers, // Requires privileged intent
    // GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.DirectMessages,
    // GatewayIntentBits.MessageContent, // Requires privileged intent
  ],
});

// Initialize services
let commandHandler: CommandHandler;
let errorService: ErrorService;
let roleSyncService: RoleSyncService;
let tagSyncService: TagSyncService;

// Handle client ready event
client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`✅ Bot logged in as ${readyClient.user.tag}`);

  // Set bot activity
  readyClient.user.setActivity('your energy levels', {
    type: ActivityType.Watching,
  });

  // Initialize services
  commandHandler = new CommandHandler(client);
  errorService = new ErrorService(client);
  roleSyncService = new RoleSyncService(client);
  tagSyncService = new TagSyncService(client);

  // Deploy commands
  try {
    await commandHandler.deployCommands();
  } catch (error) {
    logger.error('Failed to deploy commands:', error);
  }

  // Start role sync
  roleSyncService.startPeriodicSync();
  
  // Initialize tag sync service
  await tagSyncService.initialize();

  // Ensure NRG roles exist in all guilds
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      await roleSyncService.ensureNRGRoles(guild);
    } catch (error) {
      logger.error(`Failed to ensure roles in guild ${guildId}:`, error);
    }
  }

  logger.info('Bot initialization complete!');
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await commandHandler.handleCommand(interaction);
    } else if (interaction.isAutocomplete()) {
      await commandHandler.handleAutocomplete(interaction);
    }
  } catch (error) {
    await errorService.handleError(error, ErrorSeverity.MEDIUM, {
      userId: interaction.user.id,
      guildId: interaction.guildId || undefined,
      command: 'commandName' in interaction ? interaction.commandName : undefined,
    });
  }
});

// Handle member updates (role changes)
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  // Skip partial members
  if (oldMember.partial || newMember.partial) {
    return;
  }
  
  try {
    await roleSyncService.handleDiscordRoleUpdate(oldMember, newMember);
  } catch (error) {
    await errorService.handleError(error, ErrorSeverity.LOW, {
      userId: newMember.id,
      guildId: newMember.guild.id,
      action: 'roleUpdate',
    });
  }
});

// Handle guild join
client.on(Events.GuildCreate, async (guild) => {
  logger.info(`Joined new guild: ${guild.name} (${guild.id})`);
  
  try {
    await roleSyncService.ensureNRGRoles(guild);
  } catch (error) {
    await errorService.handleError(error, ErrorSeverity.MEDIUM, {
      guildId: guild.id,
      action: 'guildJoin',
    });
  }
});

// Handle errors
client.on(Events.Error, async (error) => {
  await errorService.handleError(error, ErrorSeverity.HIGH, {
    action: 'clientError',
  });
});

client.on(Events.Warn, (warning) => {
  logger.warn('Discord client warning:', warning);
});

// Handle process events
process.on('unhandledRejection', (reason, promise) => {
  if (errorService) {
    errorService.handleUnhandledRejection(reason, promise);
  } else {
    logger.error('Unhandled Rejection:', reason);
  }
});

process.on('uncaughtException', (error) => {
  if (errorService) {
    errorService.handleUncaughtException(error);
  } else {
    logger.error('Uncaught Exception:', error);
  }
  
  // Give time for error to be logged before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  
  if (roleSyncService) {
    roleSyncService.stopPeriodicSync();
  }
  
  if (tagSyncService) {
    tagSyncService.stopPeriodicSync();
  }
  
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  
  if (roleSyncService) {
    roleSyncService.stopPeriodicSync();
  }
  
  if (tagSyncService) {
    tagSyncService.stopPeriodicSync();
  }
  
  client.destroy();
  process.exit(0);
});

// Health check endpoint (can be used with a simple HTTP server if needed)
setInterval(async () => {
  if (errorService) {
    const health = await errorService.performHealthCheck();
    if (health.status !== 'healthy') {
      logger.warn('Health check failed:', health);
    }
  }
}, 60000); // Check every minute

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch((error) => {
  logger.error('Failed to login to Discord:', error);
  process.exit(1);
});