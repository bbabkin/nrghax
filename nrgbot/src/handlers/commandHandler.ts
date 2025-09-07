import {
  Client,
  Collection,
  REST,
  Routes,
  ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '../types/command';
import { logger } from '../utils/logger';
import { pingCommand } from '../commands/ping';
import { hackCommand } from '../commands/hack';
import { CONSTANTS } from '../config/constants';

export class CommandHandler {
  private commands: Collection<string, Command>;
  private cooldowns: Collection<string, Collection<string, number>>;

  constructor(_client: Client) {
    this.commands = new Collection();
    this.cooldowns = new Collection();
    this.loadCommands();
  }

  /**
   * Load all commands
   */
  private loadCommands() {
    const commands: Command[] = [
      pingCommand,
      hackCommand,
    ];

    for (const command of commands) {
      this.commands.set(command.data.name, command);
      logger.info(`Loaded command: ${command.data.name}`);
    }
  }

  /**
   * Deploy commands to Discord
   */
  async deployCommands() {
    if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
      throw new Error('Missing Discord token or client ID');
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commandData = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());

    try {
      logger.info('Started refreshing application (/) commands.');

      // Deploy global commands
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commandData }
      );

      // If a guild ID is provided, also deploy to that guild for faster updates during development
      if (process.env.DISCORD_GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(
            process.env.DISCORD_CLIENT_ID,
            process.env.DISCORD_GUILD_ID
          ),
          { body: commandData }
        );
        logger.info(`Deployed commands to guild ${process.env.DISCORD_GUILD_ID}`);
      }

      logger.info('Successfully reloaded application (/) commands.');
    } catch (error) {
      logger.error('Error deploying commands:', error);
      throw error;
    }
  }

  /**
   * Handle command execution
   */
  async handleCommand(interaction: ChatInputCommandInteraction) {
    const command = this.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    // Check if command is guild-only
    if (command.guildOnly && !interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server!',
        ephemeral: true,
      });
      return;
    }

    // Check if command is DM-only
    if (command.dmOnly && interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in DMs!',
        ephemeral: true,
      });
      return;
    }

    // Check permissions
    if (command.permissions && interaction.guild) {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (member && !member.permissions.has(command.permissions)) {
        await interaction.reply({
          content: 'You do not have permission to use this command!',
          ephemeral: true,
        });
        return;
      }
    }

    // Check cooldown
    if (!this.checkCooldown(interaction, command)) {
      const remainingTime = this.getRemainingCooldown(interaction, command);
      await interaction.reply({
        content: `Please wait ${remainingTime.toFixed(1)} seconds before using this command again.`,
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
      logger.info(`Command executed: ${interaction.commandName} by ${interaction.user.tag}`);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}:`, error);

      const errorMessage = 'There was an error executing this command!';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
    }
  }

  /**
   * Handle autocomplete interactions
   */
  async handleAutocomplete(interaction: any) {
    const command = this.commands.get(interaction.commandName);

    if (!command || !command.autocomplete) {
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      logger.error(`Error handling autocomplete for ${interaction.commandName}:`, error);
      await interaction.respond([]);
    }
  }

  /**
   * Check if user is on cooldown for a command
   */
  private checkCooldown(interaction: ChatInputCommandInteraction, command: Command): boolean {
    if (!command.cooldown) return true;

    if (!this.cooldowns.has(command.data.name)) {
      this.cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = this.cooldowns.get(command.data.name)!;
    const cooldownAmount = (command.cooldown || CONSTANTS.COMMAND_COOLDOWN_MS);

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now < expirationTime) {
        return false;
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    return true;
  }

  /**
   * Get remaining cooldown time for a user
   */
  private getRemainingCooldown(interaction: ChatInputCommandInteraction, command: Command): number {
    const timestamps = this.cooldowns.get(command.data.name);
    if (!timestamps) return 0;

    const cooldownAmount = command.cooldown || CONSTANTS.COMMAND_COOLDOWN_MS;
    const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
    
    return (expirationTime - Date.now()) / 1000;
  }

  /**
   * Get the commands collection
   */
  getCommands(): Collection<string, Command> {
    return this.commands;
  }
}