import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

dotenv.config();

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.DISCORD_GUILD_ID!;

const rest = new REST({ version: '10' }).setToken(token);

async function clearAndRedeploy() {
  try {
    logger.info('Clearing all existing commands...');

    // Clear guild commands
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [] }
    );
    logger.info('✅ Cleared guild commands');

    // Clear global commands
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: [] }
    );
    logger.info('✅ Cleared global commands');

    logger.info('Commands cleared! Run npm run deploy-commands to re-add them.');
  } catch (error) {
    logger.error('Error clearing commands:', error);
  }
}

clearAndRedeploy();