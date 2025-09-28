import { BaseCommand, CommandDefinition } from './BaseCommand';
import { IPlatformInteraction, IPlatformMessage } from '../interfaces/IPlatform';
import { hackRepository } from '../../database/repositories/hackRepository';
import { logger } from '../../utils/logger';

export class HackCommand extends BaseCommand {
  definition: CommandDefinition = {
    name: 'hack',
    description: 'Browse and discover energy hacks',
    subcommands: [
      {
        name: 'list',
        description: 'Browse all available energy hacks',
      },
      {
        name: 'search',
        description: 'Search for specific hacks',
        options: [
          {
            name: 'query',
            description: 'Search term (name or description)',
            type: 'string',
            required: true,
          },
        ],
      },
      {
        name: 'category',
        description: 'Browse hacks by category',
        options: [
          {
            name: 'category',
            description: 'Category to browse',
            type: 'string',
            required: true,
            choices: [
              { name: 'Morning Routine', value: 'morning' },
              { name: 'Exercise', value: 'exercise' },
              { name: 'Nutrition', value: 'nutrition' },
              { name: 'Sleep', value: 'sleep' },
              { name: 'Productivity', value: 'productivity' },
              { name: 'Mindfulness', value: 'mindfulness' },
              { name: 'Energy Management', value: 'energy' },
              { name: 'Wellness', value: 'wellness' },
            ],
          },
        ],
      },
    ],
  };

  async execute(interaction: IPlatformInteraction): Promise<void> {
    const subcommand = this.getSubcommand(interaction);

    try {
      switch (subcommand) {
        case 'list':
          await this.handleList(interaction);
          break;
        case 'search':
          await this.handleSearch(interaction);
          break;
        case 'category':
          await this.handleCategory(interaction);
          break;
        default:
          await this.handleDefault(interaction);
      }
    } catch (error) {
      logger.error('Error executing hack command:', error);
      await interaction.reply({
        content: '❌ Something went wrong while fetching hacks. Please try again later.',
        ephemeral: true,
      });
    }
  }

  private async handleList(interaction: IPlatformInteraction): Promise<void> {
    const hacks = await hackRepository.getAllHacks();

    if (!hacks || hacks.length === 0) {
      await interaction.reply({
        content: '📭 No hacks found. Check back later for new content!',
        ephemeral: true,
      });
      return;
    }

    const message: IPlatformMessage = {
      content: '',
      embeds: [
        {
          title: '⚡ Energy Hacks Collection',
          description: `Found ${hacks.length} amazing energy hacks to boost your life!`,
          color: 0x10b981,
          fields: hacks.slice(0, 5).map((hack: any) => ({
            name: `🔋 ${hack.name}`,
            value: `${hack.description?.substring(0, 100)}${
              hack.description && hack.description.length > 100 ? '...' : ''
            }\n\`Category: ${hack.category || 'General'}\``,
            inline: false,
          })),
          footer: {
            text: `Showing first 5 hacks • Use /hack search to find specific topics`,
          },
          timestamp: new Date(),
        },
      ],
      buttons: [
        {
          id: 'hack_more',
          label: '🔍 Show More',
          style: 'primary',
        },
        {
          id: 'hack_random',
          label: '🎲 Random Hack',
          style: 'secondary',
        },
      ],
    };

    await interaction.reply(message);
  }

  private async handleSearch(interaction: IPlatformInteraction): Promise<void> {
    const query = this.getOption<string>(interaction, 'query');

    if (!query) {
      await interaction.reply({
        content: '❌ Please provide a search query.',
        ephemeral: true,
      });
      return;
    }

    const hacks = await hackRepository.searchHacks(query);

    if (!hacks || hacks.length === 0) {
      await interaction.reply({
        content: `🔍 No hacks found matching "${query}". Try different keywords!`,
        ephemeral: true,
      });
      return;
    }

    const message: IPlatformMessage = {
      content: '',
      embeds: [
        {
          title: `🔍 Search Results for "${query}"`,
          description: `Found ${hacks.length} matching hack${hacks.length === 1 ? '' : 's'}`,
          color: 0x3b82f6,
          fields: hacks.slice(0, 5).map((hack: any) => ({
            name: `⚡ ${hack.name}`,
            value: `${hack.description?.substring(0, 150)}${
              hack.description && hack.description.length > 150 ? '...' : ''
            }\n\`Category: ${hack.category || 'General'}\``,
            inline: false,
          })),
          footer: {
            text: 'Try /hack category to browse by specific topics',
          },
          timestamp: new Date(),
        },
      ],
    };

    await interaction.reply(message);
  }

  private async handleCategory(interaction: IPlatformInteraction): Promise<void> {
    const category = this.getOption<string>(interaction, 'category');

    if (!category) {
      await interaction.reply({
        content: '❌ Please select a category.',
        ephemeral: true,
      });
      return;
    }

    const hacks = await hackRepository.getHacksByCategory(category);

    if (!hacks || hacks.length === 0) {
      await interaction.reply({
        content: `📂 No hacks found in the "${category}" category yet. Check back soon!`,
        ephemeral: true,
      });
      return;
    }

    const categoryNames: Record<string, string> = {
      morning: 'Morning Routine',
      exercise: 'Exercise',
      nutrition: 'Nutrition',
      sleep: 'Sleep',
      productivity: 'Productivity',
      mindfulness: 'Mindfulness',
      energy: 'Energy Management',
      wellness: 'Wellness',
    };

    const categoryName = categoryNames[category] || category;
    const categoryEmojis: Record<string, string> = {
      morning: '🌅',
      exercise: '💪',
      nutrition: '🥗',
      sleep: '😴',
      productivity: '📈',
      mindfulness: '🧘',
      energy: '⚡',
      wellness: '🌟',
    };

    const emoji = categoryEmojis[category] || '📁';

    const message: IPlatformMessage = {
      content: '',
      embeds: [
        {
          title: `${emoji} ${categoryName} Hacks`,
          description: `Discover ${hacks.length} powerful ${categoryName.toLowerCase()} hack${
            hacks.length === 1 ? '' : 's'
          } to transform your energy!`,
          color: 0xf59e0b,
          fields: hacks.slice(0, 8).map((hack: any) => ({
            name: `${emoji} ${hack.name}`,
            value: `${hack.description?.substring(0, 120)}${
              hack.description && hack.description.length > 120 ? '...' : ''
            }`,
            inline: hacks.length > 4,
          })),
          footer: {
            text: `${categoryName} • Use /hack search to find specific techniques`,
          },
          timestamp: new Date(),
        },
      ],
      buttons: [
        {
          id: `category_${category}_more`,
          label: '📚 View All',
          style: 'primary',
        },
      ],
    };

    await interaction.reply(message);
  }

  private async handleDefault(interaction: IPlatformInteraction): Promise<void> {
    const message: IPlatformMessage = {
      content: '',
      embeds: [
        {
          title: '⚡ NRGHax Energy Optimization',
          description: 'Welcome to your personal energy optimization hub! Choose how you\'d like to explore:',
          color: 0x10b981,
          fields: [
            {
              name: '📚 Browse All Hacks',
              value: 'Use `/hack list` to see our complete collection',
              inline: true,
            },
            {
              name: '🔍 Search Hacks',
              value: 'Use `/hack search [query]` to find specific topics',
              inline: true,
            },
            {
              name: '📁 Browse by Category',
              value: 'Use `/hack category [name]` to explore specific areas',
              inline: true,
            },
          ],
          thumbnail: 'https://via.placeholder.com/150x150/10b981/ffffff?text=NRG',
          footer: {
            text: 'Start your energy optimization journey today!',
          },
          timestamp: new Date(),
        },
      ],
      buttons: [
        {
          id: 'hack_quick_list',
          label: '📚 Quick Browse',
          style: 'primary',
        },
        {
          id: 'hack_categories',
          label: '📁 Categories',
          style: 'secondary',
        },
      ],
    };

    await interaction.reply(message);
  }
}