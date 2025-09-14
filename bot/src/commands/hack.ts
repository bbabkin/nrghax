import {
  SlashCommandBuilder,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '../types/command';
import { CONSTANTS } from '../config/constants';
import { hackRepository } from '../database/repositories/hackRepository';
import { logger } from '../utils/logger';
import {
  createHackCard,
  createHackButtons,
  sendHackCarousel,
} from '../utils/hackCards';

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

  // Use the new carousel display for all hacks
  await sendHackCarousel(interaction, hacks, 'All Energy Hacks');
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

  await sendHackCarousel(interaction, hacks, `Search Results for "${query}"`);
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

  await sendHackCarousel(interaction, hacks, `${categoryNames[category]} Hacks`);
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

  // Show single hack with full details and action buttons
  const embed = createHackCard(hack, true);
  const buttons = createHackButtons(hack);
  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
}

// Old pagination and embed functions removed - now using hackCards utility