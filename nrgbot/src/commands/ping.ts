import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';
import { CONSTANTS } from '../config/constants';

export const pingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is online and responsive'),

  async execute(interaction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setColor(CONSTANTS.BRAND_COLOR)
      .setTitle('⚡ Pong!')
      .setDescription(CONSTANTS.MESSAGES.PING_RESPONSE)
      .addFields(
        { name: 'Roundtrip Latency', value: `${latency}ms`, inline: true },
        { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
        { name: 'Status', value: '✅ All systems operational', inline: false }
      )
      .setFooter({ text: CONSTANTS.FOOTER_TEXT })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};