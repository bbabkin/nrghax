import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction
} from 'discord.js';
import { Hack } from '../database/supabase';
import { CONSTANTS } from '../config/constants';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * Create a rich card embed for a single hack
 */
export function createHackCard(hack: Hack, showFullDetails = false): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(CONSTANTS.BRAND_COLOR)
    .setTitle(`⚡ ${hack.name}`)
    .setURL(`${APP_URL}/hacks/${hack.id}`)
    .setDescription(hack.description)
    .setFooter({ text: `ID: ${hack.id} • ${CONSTANTS.FOOTER_TEXT}` })
    .setTimestamp();

  // Add thumbnail if available
  if (hack.image_url) {
    embed.setThumbnail(hack.image_url);
  }

  // Add fields based on available data
  const fields: { name: string; value: string; inline: boolean }[] = [];

  if (hack.category) {
    fields.push({
      name: '📂 Category',
      value: hack.category.charAt(0).toUpperCase() + hack.category.slice(1),
      inline: true
    });
  }

  if (hack.difficulty) {
    const difficultyEmoji = {
      beginner: '🟢',
      intermediate: '🟡',
      advanced: '🔴'
    }[hack.difficulty] || '⚪';

    fields.push({
      name: '🎯 Difficulty',
      value: `${difficultyEmoji} ${hack.difficulty.charAt(0).toUpperCase() + hack.difficulty.slice(1)}`,
      inline: true
    });
  }

  if (hack.energy_impact) {
    fields.push({
      name: '⚡ Energy Impact',
      value: `+${hack.energy_impact}%`,
      inline: true
    });
  }

  if (hack.time_investment) {
    fields.push({
      name: '⏱️ Time Required',
      value: hack.time_investment,
      inline: true
    });
  }

  if (hack.requirements && hack.requirements.length > 0 && showFullDetails) {
    fields.push({
      name: '📋 Requirements',
      value: hack.requirements.map(r => `• ${r}`).join('\n').substring(0, 1024),
      inline: false
    });
  }

  if (hack.content_type === 'link' && hack.external_link) {
    fields.push({
      name: '🔗 External Resource',
      value: `[Click here to learn more](${hack.external_link})`,
      inline: false
    });
  }

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

/**
 * Create action buttons for hack interactions
 */
export function createHackButtons(hack: Hack): ActionRowBuilder<ButtonBuilder> {
  const buttons = [
    new ButtonBuilder()
      .setLabel('View on Website')
      .setStyle(ButtonStyle.Link)
      .setURL(`${APP_URL}/hacks/${hack.id}`)
      .setEmoji('🌐'),
  ];

  if (hack.content_type === 'link' && hack.external_link) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('External Resource')
        .setStyle(ButtonStyle.Link)
        .setURL(hack.external_link)
        .setEmoji('🔗')
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId(`hack_details_${hack.id}`)
      .setLabel('More Details')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📖')
  );

  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}

/**
 * Send multiple hacks as a carousel of cards
 */
export async function sendHackCarousel(
  interaction: ChatInputCommandInteraction,
  hacks: Hack[],
  title: string
) {
  if (hacks.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(CONSTANTS.BRAND_COLOR)
      .setTitle('No Hacks Found')
      .setDescription('No hacks match your criteria. Check back soon!')
      .setFooter({ text: CONSTANTS.FOOTER_TEXT })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // For a single hack, show it with full details
  if (hacks.length === 1) {
    const embed = createHackCard(hacks[0], true);
    const buttons = createHackButtons(hacks[0]);
    await interaction.editReply({
      embeds: [embed],
      components: [buttons]
    });
    return;
  }

  // For multiple hacks, create a summary embed with cards
  const summaryEmbed = new EmbedBuilder()
    .setColor(CONSTANTS.BRAND_COLOR)
    .setTitle(`🚀 ${title}`)
    .setDescription(`Found **${hacks.length}** energy hacks for you! Each card below is clickable.`)
    .setFooter({ text: CONSTANTS.FOOTER_TEXT })
    .setTimestamp();

  // Create individual cards for each hack (limit to 10 for Discord's embed limit)
  const hackEmbeds = hacks.slice(0, 10).map(hack => {
    const card = new EmbedBuilder()
      .setColor(CONSTANTS.BRAND_COLOR)
      .setTitle(`⚡ ${hack.name}`)
      .setURL(`${APP_URL}/hacks/${hack.id}`)
      .setDescription(
        hack.description.length > 200
          ? hack.description.substring(0, 197) + '...'
          : hack.description
      );

    // Add compact fields
    const info: string[] = [];
    if (hack.category) info.push(`📂 ${hack.category}`);
    if (hack.difficulty) info.push(`🎯 ${hack.difficulty}`);
    if (hack.energy_impact) info.push(`⚡ +${hack.energy_impact}%`);

    if (info.length > 0) {
      card.addFields({
        name: 'Quick Info',
        value: info.join(' • '),
        inline: false
      });
    }

    if (hack.image_url) {
      card.setThumbnail(hack.image_url);
    }

    return card;
  });

  // Create navigation buttons if there are many hacks
  const navigationButtons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setLabel('View All on Website')
        .setStyle(ButtonStyle.Link)
        .setURL(`${APP_URL}/hacks`)
        .setEmoji('🌐'),
      new ButtonBuilder()
        .setCustomId('refresh_hacks')
        .setLabel('Refresh')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄')
    );

  // Send all embeds (Discord allows up to 10 embeds per message)
  await interaction.editReply({
    embeds: [summaryEmbed, ...hackEmbeds],
    components: [navigationButtons]
  });
}

/**
 * Create a compact list view of hacks
 */
export function createHackListEmbed(hacks: Hack[], page: number, totalPages: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(CONSTANTS.BRAND_COLOR)
    .setTitle(`📚 Energy Hacks Library (Page ${page + 1}/${totalPages})`)
    .setDescription('Click on any hack title to view it on the website!')
    .setFooter({ text: CONSTANTS.FOOTER_TEXT })
    .setTimestamp();

  hacks.forEach((hack, index) => {
    const difficulty = hack.difficulty ? ` [${hack.difficulty}]` : '';
    const impact = hack.energy_impact ? ` • ⚡+${hack.energy_impact}%` : '';

    embed.addFields({
      name: `${index + 1}. ${hack.name}${difficulty}`,
      value: `${hack.description.substring(0, 100)}...${impact}\n` +
             `[📖 View Details](${APP_URL}/hacks/${hack.id}) • ID: \`${hack.id.substring(0, 8)}\``,
      inline: false
    });
  });

  return embed;
}