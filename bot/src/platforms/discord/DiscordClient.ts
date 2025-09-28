import {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  ChatInputCommandInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  DMChannel,
} from 'discord.js';
import {
  IPlatformClient,
  IPlatformUser,
  IPlatformChannel,
  IPlatformMessage,
  IPlatformInteraction,
  IPlatformEmbed,
} from '../../core/interfaces/IPlatform';
import { logger } from '../../utils/logger';

export class DiscordClient implements IPlatformClient {
  public readonly platform = 'discord' as const;
  private client: Client;
  private commandHandler?: (interaction: IPlatformInteraction) => Promise<void>;
  private buttonHandler?: (interaction: IPlatformInteraction, buttonId: string) => Promise<void>;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        // Add more intents as needed
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.once(Events.ClientReady, (readyClient) => {
      logger.info(`✅ Discord bot logged in as ${readyClient.user.tag}`);

      // Set bot activity
      readyClient.user.setActivity('your energy levels', {
        type: ActivityType.Watching,
      });
    });

    // Handle slash commands
    this.client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          if (!this.commandHandler) return;

          const platformInteraction = this.createInteractionFromDiscord(interaction);
          await this.commandHandler(platformInteraction);
        } else if (interaction.isButton()) {
          if (!this.buttonHandler) return;

          const platformInteraction = this.createInteractionFromDiscord(interaction);
          await this.buttonHandler(platformInteraction, interaction.customId);
        }
      } catch (error) {
        logger.error('Error handling Discord interaction:', error);
      }
    });
  }

  async start(): Promise<void> {
    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN is not set');
    }

    await this.client.login(process.env.DISCORD_TOKEN);
  }

  async stop(): Promise<void> {
    this.client.destroy();
    logger.info('Discord bot stopped');
  }

  isReady(): boolean {
    return this.client.isReady();
  }

  onCommand(handler: (interaction: IPlatformInteraction) => Promise<void>): void {
    this.commandHandler = handler;
  }

  onButton(handler: (interaction: IPlatformInteraction, buttonId: string) => Promise<void>): void {
    this.buttonHandler = handler;
  }

  async sendMessage(channelId: string, message: IPlatformMessage): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || (!this.isTextChannel(channel) && !this.isDMChannel(channel))) {
        throw new Error('Channel not found or not a text channel');
      }

      const discordMessage = this.convertToDiscordMessage(message);
      await (channel as TextChannel | DMChannel).send(discordMessage);
    } catch (error) {
      logger.error('Failed to send Discord message:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<IPlatformUser | null> {
    try {
      const user = await this.client.users.fetch(userId);
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatarUrl: user.displayAvatarURL(),
        platform: 'discord',
      };
    } catch (error) {
      logger.error('Failed to get Discord user:', error);
      return null;
    }
  }

  async getChannel(channelId: string): Promise<IPlatformChannel | null> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel) return null;

      if (this.isTextChannel(channel)) {
        return {
          id: channel.id,
          name: channel.name,
          type: 'text',
          platform: 'discord',
        };
      } else if (this.isDMChannel(channel)) {
        return {
          id: channel.id,
          name: 'DM',
          type: 'dm',
          platform: 'discord',
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to get Discord channel:', error);
      return null;
    }
  }

  getDiscordClient(): Client {
    return this.client;
  }

  private createInteractionFromDiscord(
    interaction: ChatInputCommandInteraction | ButtonInteraction
  ): IPlatformInteraction {
    // Parse options
    const options: Record<string, any> = {};

    if (interaction.isChatInputCommand()) {
      // Get subcommand if exists
      try {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand) {
          options.subcommand = subcommand;
        }
      } catch {
        // No subcommand
      }

      // Get all options
      interaction.options.data.forEach(opt => {
        if (opt.value !== undefined) {
          options[opt.name] = opt.value;
        }
      });
    }

    return {
      user: {
        id: interaction.user.id,
        username: interaction.user.username,
        displayName: interaction.user.displayName || interaction.user.username,
        avatarUrl: interaction.user.displayAvatarURL(),
        platform: 'discord',
      },
      channel: {
        id: interaction.channelId!,
        name: interaction.channel?.isTextBased() && 'name' in interaction.channel
          ? (interaction.channel.name || 'Unknown')
          : 'DM',
        type: interaction.channel?.isDMBased() ? 'dm' : 'text',
        platform: 'discord',
      },
      guildId: interaction.guildId || undefined,
      commandName: interaction.isChatInputCommand() ? interaction.commandName : '',
      options,
      platform: 'discord',

      reply: async (message: IPlatformMessage) => {
        const discordMessage = this.convertToDiscordMessage(message);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ ...discordMessage, ephemeral: message.ephemeral });
        } else {
          await interaction.reply({ ...discordMessage, ephemeral: message.ephemeral });
        }
      },

      deferReply: async (ephemeral?: boolean) => {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferReply({ ephemeral });
        }
      },

      editReply: async (message: IPlatformMessage) => {
        const discordMessage = this.convertToDiscordMessage(message);
        await interaction.editReply(discordMessage);
      },

      followUp: async (message: IPlatformMessage) => {
        const discordMessage = this.convertToDiscordMessage(message);
        await interaction.followUp({ ...discordMessage, ephemeral: message.ephemeral });
      },
    };
  }

  private convertToDiscordMessage(message: IPlatformMessage): any {
    const result: any = {};

    if (message.content) {
      result.content = message.content;
    }

    if (message.embeds && message.embeds.length > 0) {
      result.embeds = message.embeds.map(embed => this.convertToDiscordEmbed(embed));
    }

    if (message.buttons && message.buttons.length > 0) {
      const row = new ActionRowBuilder<ButtonBuilder>();

      for (const button of message.buttons) {
        const discordButton = new ButtonBuilder()
          .setCustomId(button.id)
          .setLabel(button.label)
          .setStyle(this.mapButtonStyle(button.style))
          .setDisabled(button.disabled || false);

        if (button.url) {
          discordButton.setURL(button.url);
        }

        row.addComponents(discordButton);
      }

      result.components = [row];
    }

    return result;
  }

  private convertToDiscordEmbed(embed: IPlatformEmbed): EmbedBuilder {
    const discordEmbed = new EmbedBuilder();

    if (embed.title) {
      discordEmbed.setTitle(embed.title);
    }

    if (embed.description) {
      discordEmbed.setDescription(embed.description);
    }

    if (embed.color) {
      const color = typeof embed.color === 'string'
        ? parseInt(embed.color.replace('#', ''), 16)
        : embed.color;
      discordEmbed.setColor(color);
    }

    if (embed.fields) {
      discordEmbed.addFields(embed.fields);
    }

    if (embed.thumbnail) {
      discordEmbed.setThumbnail(embed.thumbnail);
    }

    if (embed.image) {
      discordEmbed.setImage(embed.image);
    }

    if (embed.footer) {
      discordEmbed.setFooter({
        text: embed.footer.text,
        iconURL: embed.footer.iconUrl,
      });
    }

    if (embed.timestamp) {
      discordEmbed.setTimestamp(
        typeof embed.timestamp === 'string'
          ? new Date(embed.timestamp)
          : embed.timestamp
      );
    }

    return discordEmbed;
  }

  private mapButtonStyle(style?: string): ButtonStyle {
    switch (style) {
      case 'primary':
        return ButtonStyle.Primary;
      case 'secondary':
        return ButtonStyle.Secondary;
      case 'success':
        return ButtonStyle.Success;
      case 'danger':
        return ButtonStyle.Danger;
      case 'link':
        return ButtonStyle.Link;
      default:
        return ButtonStyle.Secondary;
    }
  }

  private isTextChannel(channel: any): channel is TextChannel {
    return channel.type === 0; // GUILD_TEXT
  }

  private isDMChannel(channel: any): channel is DMChannel {
    return channel.type === 1; // DM
  }
}