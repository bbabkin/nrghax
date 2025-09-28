import { BaseCommand, CommandDefinition } from './BaseCommand';
import { IPlatformInteraction } from '../interfaces/IPlatform';

export class PingCommand extends BaseCommand {
  definition: CommandDefinition = {
    name: 'ping',
    description: 'Check if the bot is responding',
  };

  async execute(interaction: IPlatformInteraction): Promise<void> {
    const start = Date.now();

    await interaction.reply({
      content: '🏓 Pong!',
      ephemeral: true,
    });

    const latency = Date.now() - start;

    await interaction.editReply({
      content: `🏓 Pong! Latency: ${latency}ms`,
      embeds: [
        {
          title: '🤖 Bot Status',
          color: 0x00ff00,
          fields: [
            {
              name: '📡 Platform',
              value: interaction.platform === 'discord' ? '💬 Discord' : '💼 Slack',
              inline: true,
            },
            {
              name: '⚡ Response Time',
              value: `${latency}ms`,
              inline: true,
            },
            {
              name: '🟢 Status',
              value: 'Online & Ready',
              inline: true,
            },
          ],
          footer: {
            text: 'NRGHax Bot is running smoothly!',
          },
          timestamp: new Date(),
        },
      ],
    });
  }
}