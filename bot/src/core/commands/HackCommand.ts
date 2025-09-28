import { BaseCommand, CommandDefinition } from './BaseCommand';
import { IPlatformInteraction, IPlatformMessage, IPlatformEmbed } from '../interfaces/IPlatform';
import { hackRepository } from '../../database/repositories/hackRepository';
import { logger } from '../../utils/logger';
import { fixTextUrls, getHackUrl, getCategoryUrl } from '../../utils/urlUtils';

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

    // Create an embed for each hack to show images properly
    const embeds: IPlatformEmbed[] = hacks.slice(0, 5).map((hack: any) => ({
      title: `🔋 ${hack.name}`,
      description: `${fixTextUrls(hack.description)?.substring(0, 200)}${
        hack.description && hack.description.length > 200 ? '...' : ''
      }`,
      color: 0x10b981,
      image: hack.image_url ? fixTextUrls(hack.image_url) : undefined,
      fields: [
        {
          name: 'Category',
          value: hack.category || 'General',
          inline: true,
        },
        {
          name: 'Difficulty',
          value: hack.difficulty ? hack.difficulty.charAt(0).toUpperCase() + hack.difficulty.slice(1) : 'All Levels',
          inline: true,
        },
        {
          name: 'View More',
          value: `[📖 Full Details](${getHackUrl(hack.id)})`,
          inline: true,
        },
      ],
    }));

    // Add a header embed
    embeds.unshift({
      title: '⚡ Energy Hacks Collection',
      description: `Found ${hacks.length} amazing energy hacks to boost your life!\n\nShowing the first 5 hacks:`,
      color: 0x10b981,
      thumbnail: 'https://nrghax.com/images/nrg-logo.png',
    });

    const message: IPlatformMessage = {
      content: '',
      embeds: embeds,
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

    // Create embeds for search results
    const embeds: IPlatformEmbed[] = hacks.slice(0, 5).map((hack: any) => ({
      title: `⚡ ${hack.name}`,
      description: `${fixTextUrls(hack.description)?.substring(0, 200)}${
        hack.description && hack.description.length > 200 ? '...' : ''
      }`,
      color: 0x3b82f6,
      image: hack.image_url ? fixTextUrls(hack.image_url) : undefined,
      fields: [
        {
          name: 'Category',
          value: hack.category || 'General',
          inline: true,
        },
        {
          name: 'Difficulty',
          value: hack.difficulty ? hack.difficulty.charAt(0).toUpperCase() + hack.difficulty.slice(1) : 'All Levels',
          inline: true,
        },
        {
          name: 'View More',
          value: `[📖 Full Details](${getHackUrl(hack.id)})`,
          inline: true,
        },
      ],
    }));

    // Add header embed
    embeds.unshift({
      title: `🔍 Search Results for "${query}"`,
      description: `Found ${hacks.length} matching hack${hacks.length === 1 ? '' : 's'}`,
      color: 0x3b82f6,
      footer: {
        text: 'Try /hack category to browse by specific topics',
      },
    });

    const message: IPlatformMessage = {
      content: '',
      embeds: embeds,
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

    // Create embeds for category results
    const embeds: IPlatformEmbed[] = hacks.slice(0, 5).map((hack: any) => ({
      title: `${emoji} ${hack.name}`,
      description: `${fixTextUrls(hack.description)?.substring(0, 200)}${
        hack.description && hack.description.length > 200 ? '...' : ''
      }`,
      color: 0xf59e0b,
      image: hack.image_url ? fixTextUrls(hack.image_url) : undefined,
      fields: [
        {
          name: 'Difficulty',
          value: hack.difficulty ? hack.difficulty.charAt(0).toUpperCase() + hack.difficulty.slice(1) : 'All Levels',
          inline: true,
        },
        {
          name: 'Time Investment',
          value: hack.time_investment || 'Varies',
          inline: true,
        },
        {
          name: 'View More',
          value: `[📖 Full Details](${getHackUrl(hack.id)})`,
          inline: true,
        },
      ],
    }));

    // Add header embed
    embeds.unshift({
      title: `${emoji} ${categoryName} Hacks`,
      description: `Discover ${hacks.length} powerful ${categoryName.toLowerCase()} hack${
        hacks.length === 1 ? '' : 's'
      } to transform your energy!\n\nShowing the first 5:`,
      color: 0xf59e0b,
      thumbnail: 'https://nrghax.com/images/nrg-logo.png',
      footer: {
        text: `${categoryName} • Use /hack search to find specific techniques`,
      },
    });

    const message: IPlatformMessage = {
      content: '',
      embeds: embeds,
      buttons: [
        {
          id: `category_${category}_more`,
          label: '📚 View All on Website',
          style: 'primary',
          url: getCategoryUrl(category),
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
          thumbnail: 'https://nrghax.com/images/nrg-logo.png',
          footer: {
            text: 'Start your energy optimization journey today! • Visit nrghax.com',
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