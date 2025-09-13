import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '../types/command';
import { CONSTANTS } from '../config/constants';
import { hackRepository } from '../database/repositories/hackRepository';
import { Hack } from '../database/supabase';
import { logger } from '../utils/logger';

export const hackCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('hack')
    .setDescription('Browse and discover energy hacks')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Browse all available energy hacks')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription('Search for specific hacks')
        .addStringOption(option =>
          option
            .setName('query')
            .setDescription('Search term (name or description)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('category')
        .setDescription('Browse hacks by category')
        .addStringOption(option =>
          option
            .setName('category')
            .setDescription('Category to browse')
            .setRequired(true)
            .addChoices(
              { name: 'Morning Routine', value: 'morning' },
              { name: 'Exercise', value: 'exercise' },
              { name: 'Nutrition', value: 'nutrition' },
              { name: 'Sleep', value: 'sleep' },
              { name: 'Productivity', value: 'productivity' },
              { name: 'Mindfulness', value: 'mindfulness' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View details of a specific hack')
        .addStringOption(option =>
          option
            .setName('id')
            .setDescription('Hack ID to view')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ) as any,

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const hacks = await hackRepository.getAllHacks();
    
    const filtered = hacks
      .filter(hack => 
        hack.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
        hack.id.includes(focusedValue)
      )
      .slice(0, 25);

    await interaction.respond(
      filtered.map(hack => ({
        name: `${hack.name} (${hack.category || 'General'})`,
        value: hack.id,
      }))
    );
  },

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'list':
          await handleListHacks(interaction);
          break;
        case 'search':
          await handleSearchHacks(interaction);
          break;
        case 'category':
          await handleCategoryHacks(interaction);
          break;
        case 'view':
          await handleViewHack(interaction);
          break;
      }
    } catch (error) {
      logger.error('Error executing hack command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('Oops!')
        .setDescription(CONSTANTS.MESSAGES.ERROR_GENERIC)
        .setFooter({ text: CONSTANTS.FOOTER_TEXT })
        .setTimestamp();

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};

async function handleListHacks(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const hacks = await hackRepository.getAllHacks();
  
  if (hacks.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(CONSTANTS.BRAND_COLOR)
      .setTitle('No Hacks Available')
      .setDescription('Check back soon for new energy optimization hacks!')
      .setFooter({ text: CONSTANTS.FOOTER_TEXT })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  await sendPaginatedHacks(interaction, hacks, 'All Energy Hacks');
}

async function handleSearchHacks(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const query = interaction.options.getString('query', true);
  const hacks = await hackRepository.searchHacks(query);

  if (hacks.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(CONSTANTS.BRAND_COLOR)
      .setTitle('No Results Found')
      .setDescription(`${CONSTANTS.MESSAGES.ERROR_NOT_FOUND}\nTry searching with different keywords!`)
      .setFooter({ text: CONSTANTS.FOOTER_TEXT })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  await sendPaginatedHacks(interaction, hacks, `Search Results for "${query}"`);
}

async function handleCategoryHacks(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const category = interaction.options.getString('category', true);
  const hacks = await hackRepository.getHacksByCategory(category);

  if (hacks.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(CONSTANTS.BRAND_COLOR)
      .setTitle('No Hacks in Category')
      .setDescription(`No hacks found in the ${category} category yet. Check back soon!`)
      .setFooter({ text: CONSTANTS.FOOTER_TEXT })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const categoryNames: Record<string, string> = {
    morning: 'Morning Routine',
    exercise: 'Exercise',
    nutrition: 'Nutrition',
    sleep: 'Sleep',
    productivity: 'Productivity',
    mindfulness: 'Mindfulness',
  };

  await sendPaginatedHacks(interaction, hacks, `${categoryNames[category]} Hacks`);
}

async function handleViewHack(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const hackId = interaction.options.getString('id', true);
  const hack = await hackRepository.getHackById(hackId);

  if (!hack) {
    const embed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('Hack Not Found')
      .setDescription(CONSTANTS.MESSAGES.ERROR_NOT_FOUND)
      .setFooter({ text: CONSTANTS.FOOTER_TEXT })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const embed = createHackEmbed(hack, true);
  await interaction.editReply({ embeds: [embed] });
}

async function sendPaginatedHacks(interaction: ChatInputCommandInteraction, hacks: Hack[], title: string) {
  let currentPage = 0;
  const totalPages = Math.ceil(hacks.length / CONSTANTS.HACKS_PER_PAGE);

  const generateEmbed = (page: number) => {
    const start = page * CONSTANTS.HACKS_PER_PAGE;
    const end = start + CONSTANTS.HACKS_PER_PAGE;
    const pageHacks = hacks.slice(start, end);

    const embed = new EmbedBuilder()
      .setColor(CONSTANTS.BRAND_COLOR)
      .setTitle(`${title} (Page ${page + 1}/${totalPages})`)
      .setDescription(CONSTANTS.MESSAGES.HACK_INTRO)
      .setFooter({ text: CONSTANTS.FOOTER_TEXT })
      .setTimestamp();

    pageHacks.forEach(hack => {
      const difficulty = hack.difficulty ? ` • ${hack.difficulty}` : '';
      const impact = hack.energy_impact ? ` • Energy: +${hack.energy_impact}%` : '';
      
      embed.addFields({
        name: `${hack.name}${difficulty}${impact}`,
        value: `${hack.description.substring(0, 100)}${hack.description.length > 100 ? '...' : ''}\n` +
               `ID: \`${hack.id}\` | Category: ${hack.category || 'General'}`,
        inline: false,
      });
    });

    return embed;
  };

  const generateButtons = (page: number) => {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('first')
          .setLabel('⏮️ First')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀️ Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next ▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1),
        new ButtonBuilder()
          .setCustomId('last')
          .setLabel('Last ⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1)
      );
    return row;
  };

  const message = await interaction.editReply({
    embeds: [generateEmbed(currentPage)],
    components: totalPages > 1 ? [generateButtons(currentPage)] : [],
  });

  if (totalPages <= 1) return;

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000, // 5 minutes
  });

  collector.on('collect', async (i: any) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({
        content: 'You cannot use these buttons.',
        ephemeral: true,
      });
      return;
    }

    switch (i.customId) {
      case 'first':
        currentPage = 0;
        break;
      case 'prev':
        currentPage = Math.max(0, currentPage - 1);
        break;
      case 'next':
        currentPage = Math.min(totalPages - 1, currentPage + 1);
        break;
      case 'last':
        currentPage = totalPages - 1;
        break;
    }

    await i.update({
      embeds: [generateEmbed(currentPage)],
      components: [generateButtons(currentPage)],
    });
  });

  collector.on('end', async () => {
    await interaction.editReply({
      components: [],
    });
  });
}

function createHackEmbed(hack: Hack, detailed = false): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(CONSTANTS.BRAND_COLOR)
    .setTitle(hack.name)
    .setDescription(hack.description)
    .setFooter({ text: CONSTANTS.FOOTER_TEXT })
    .setTimestamp();

  if (detailed) {
    if (hack.requirements && hack.requirements.length > 0) {
      embed.addFields({
        name: '📋 Requirements',
        value: hack.requirements.map(r => `• ${r}`).join('\n'),
        inline: false,
      });
    }

    const fields = [];
    
    if (hack.category) {
      fields.push({ name: 'Category', value: hack.category, inline: true });
    }
    
    if (hack.difficulty) {
      const difficultyEmoji = {
        beginner: '🟢',
        intermediate: '🟡',
        advanced: '🔴',
      };
      fields.push({
        name: 'Difficulty',
        value: `${difficultyEmoji[hack.difficulty]} ${hack.difficulty}`,
        inline: true,
      });
    }
    
    if (hack.energy_impact) {
      fields.push({
        name: 'Energy Impact',
        value: `+${hack.energy_impact}%`,
        inline: true,
      });
    }
    
    if (hack.time_investment) {
      fields.push({
        name: 'Time Investment',
        value: hack.time_investment,
        inline: true,
      });
    }

    if (fields.length > 0) {
      embed.addFields(fields);
    }

    embed.addFields({
      name: 'How to Use',
      value: 'Start implementing this hack today to boost your energy levels! Track your progress and share your results with the community.',
      inline: false,
    });
  }

  return embed;
}