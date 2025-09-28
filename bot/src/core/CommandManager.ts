import { BaseCommand } from './commands/BaseCommand';
import { HackCommand } from './commands/HackCommand';
import { PingCommand } from './commands/PingCommand';
import { IPlatformClient, IPlatformInteraction } from './interfaces/IPlatform';
import { logger } from '../utils/logger';

export class CommandManager {
  private commands: Map<string, BaseCommand> = new Map();
  private platforms: IPlatformClient[] = [];

  constructor() {
    this.loadCommands();
  }

  private loadCommands(): void {
    const commands = [
      new PingCommand(),
      new HackCommand(),
    ];

    for (const command of commands) {
      this.commands.set(command.definition.name, command);
      logger.info(`Loaded command: ${command.definition.name}`);
    }
  }

  addPlatform(platform: IPlatformClient): void {
    this.platforms.push(platform);

    // Set up command handling
    platform.onCommand(this.handleCommand.bind(this));
    platform.onButton(this.handleButton.bind(this));

    logger.info(`Added platform: ${platform.platform}`);
  }

  async deployCommands(): Promise<void> {
    for (const platform of this.platforms) {
      await this.deployCommandsForPlatform(platform);
    }
  }

  private async deployCommandsForPlatform(platform: IPlatformClient): Promise<void> {
    if (platform.platform === 'discord') {
      await this.deployDiscordCommands(platform);
    } else if (platform.platform === 'slack') {
      await this.deploySlackCommands(platform);
    }
  }

  private async deployDiscordCommands(_platform: IPlatformClient): Promise<void> {
    try {
      // Import Discord.js types only when needed
      const { REST, Routes, SlashCommandBuilder } = await import('discord.js');

      if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
        throw new Error('Missing Discord credentials');
      }

      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

      const commandData = Array.from(this.commands.values()).map(cmd => {
        const builder = new SlashCommandBuilder()
          .setName(cmd.definition.name)
          .setDescription(cmd.definition.description);

        // Add subcommands
        if (cmd.definition.subcommands) {
          for (const sub of cmd.definition.subcommands) {
            builder.addSubcommand(subcommand => {
              subcommand.setName(sub.name).setDescription(sub.description);

              // Add options to subcommand
              if (sub.options) {
                for (const option of sub.options) {
                  this.addDiscordOption(subcommand, option);
                }
              }

              return subcommand;
            });
          }
        }

        // Add global options (if no subcommands)
        if (!cmd.definition.subcommands && cmd.definition.options) {
          for (const option of cmd.definition.options) {
            this.addDiscordOption(builder, option);
          }
        }

        return builder.toJSON();
      });

      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commandData }
      );

      logger.info(`Successfully deployed ${commandData.length} Discord commands`);
    } catch (error) {
      logger.error('Failed to deploy Discord commands:', error);
      throw error;
    }
  }

  private addDiscordOption(builder: any, option: any): void {
    switch (option.type) {
      case 'string':
        builder.addStringOption((opt: any) => {
          opt.setName(option.name)
             .setDescription(option.description)
             .setRequired(option.required || false);

          if (option.choices) {
            opt.addChoices(...option.choices);
          }

          return opt;
        });
        break;
      case 'number':
        builder.addNumberOption((opt: any) =>
          opt.setName(option.name)
             .setDescription(option.description)
             .setRequired(option.required || false)
        );
        break;
      case 'boolean':
        builder.addBooleanOption((opt: any) =>
          opt.setName(option.name)
             .setDescription(option.description)
             .setRequired(option.required || false)
        );
        break;
      case 'user':
        builder.addUserOption((opt: any) =>
          opt.setName(option.name)
             .setDescription(option.description)
             .setRequired(option.required || false)
        );
        break;
      case 'channel':
        builder.addChannelOption((opt: any) =>
          opt.setName(option.name)
             .setDescription(option.description)
             .setRequired(option.required || false)
        );
        break;
    }
  }

  private async deploySlackCommands(_platform: IPlatformClient): Promise<void> {
    // Slack commands are typically registered through the Slack app configuration
    // This would involve API calls to register slash commands if doing it programmatically
    logger.info('Slack commands should be configured in the Slack app dashboard');
  }

  private async handleCommand(interaction: IPlatformInteraction): Promise<void> {
    const command = this.commands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: '❌ Unknown command. Please try again.',
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}:`, error);

      const errorMessage = {
        content: '❌ An error occurred while executing this command. Please try again later.',
        ephemeral: true,
      };

      if (interaction.platform === 'discord') {
        // For Discord, check if we can still reply
        try {
          await interaction.reply(errorMessage);
        } catch {
          try {
            await interaction.followUp(errorMessage);
          } catch {
            logger.error('Failed to send error message to Discord');
          }
        }
      } else {
        // For Slack, try to reply
        try {
          await interaction.reply(errorMessage);
        } catch {
          logger.error('Failed to send error message to Slack');
        }
      }
    }
  }

  private async handleButton(interaction: IPlatformInteraction, buttonId: string): Promise<void> {
    logger.info(`Button clicked: ${buttonId} on ${interaction.platform}`);

    // Handle button interactions
    if (buttonId.startsWith('hack_')) {
      // Delegate to hack command button handler
      const hackCommand = this.commands.get('hack') as HackCommand;
      if (hackCommand) {
        await this.handleHackButton(interaction, buttonId, hackCommand);
      }
    }
  }

  private async handleHackButton(
    interaction: IPlatformInteraction,
    buttonId: string,
    hackCommand: HackCommand
  ): Promise<void> {
    try {
      switch (buttonId) {
        case 'hack_more':
          // Show more hacks
          interaction.options = { subcommand: 'list' };
          await hackCommand.execute(interaction);
          break;

        case 'hack_random':
          // Show random hack
          await interaction.reply({
            content: '🎲 Here\'s a random energy hack for you!',
            embeds: [
              {
                title: '⚡ Random Energy Boost',
                description: 'Try the **5-Minute Morning Stretch** - Start your day with light stretching to activate your body and boost circulation!',
                color: 0xf59e0b,
                fields: [
                  {
                    name: '⏱️ Time Required',
                    value: '5 minutes',
                    inline: true,
                  },
                  {
                    name: '💪 Difficulty',
                    value: 'Beginner',
                    inline: true,
                  },
                  {
                    name: '🎯 Benefits',
                    value: 'Increased energy, better mood, improved flexibility',
                    inline: false,
                  },
                ],
                footer: {
                  text: 'Use /hack search to find more specific hacks!',
                },
              },
            ],
          });
          break;

        case 'hack_quick_list':
          interaction.options = { subcommand: 'list' };
          await hackCommand.execute(interaction);
          break;

        case 'hack_categories':
          await interaction.reply({
            content: '📁 **Available Categories:**\n\n🌅 Morning Routine\n💪 Exercise\n🥗 Nutrition\n😴 Sleep\n📈 Productivity\n🧘 Mindfulness\n⚡ Energy Management\n🌟 Wellness\n\nUse `/hack category [name]` to explore any category!',
            ephemeral: true,
          });
          break;

        default:
          if (buttonId.startsWith('category_')) {
            const category = buttonId.split('_')[1];
            interaction.options = { subcommand: 'category', category };
            await hackCommand.execute(interaction);
          }
      }
    } catch (error) {
      logger.error('Error handling hack button:', error);
      await interaction.reply({
        content: '❌ Something went wrong. Please try again.',
        ephemeral: true,
      });
    }
  }

  getAllCommands(): BaseCommand[] {
    return Array.from(this.commands.values());
  }
}