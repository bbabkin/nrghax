import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { pingCommand } from './commands/ping';
import { hackCommand } from './commands/hack';

dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
  logger.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID');
  process.exit(1);
}

const commands = [
  pingCommand.data.toJSON(),
  hackCommand.data.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    // Deploy global commands
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands }
    ) as any[];

    logger.info(`Successfully reloaded ${data.length} global application (/) commands.`);

    // If guild ID is provided, deploy to guild as well (for faster updates during development)
    if (process.env.DISCORD_GUILD_ID) {
      const guildData = await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID!,
          process.env.DISCORD_GUILD_ID
        ),
        { body: commands }
      ) as any[];

      logger.info(`Successfully reloaded ${guildData.length} guild application (/) commands.`);
    }
  } catch (error) {
    logger.error('Error deploying commands:', error);
    process.exit(1);
  }
})();