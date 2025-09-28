import { App, SlashCommand, ButtonAction } from '@slack/bolt';
import {
  IPlatformClient,
  IPlatformUser,
  IPlatformChannel,
  IPlatformMessage,
  IPlatformInteraction,
  IPlatformEmbed,
} from '../../core/interfaces/IPlatform';
import { logger } from '../../utils/logger';

export class SlackClient implements IPlatformClient {
  public readonly platform = 'slack' as const;
  private app: App;
  private commandHandler?: (interaction: IPlatformInteraction) => Promise<void>;
  private buttonHandler?: (interaction: IPlatformInteraction, buttonId: string) => Promise<void>;
  private ready = false;

  constructor() {
    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
      socketMode: true,
      appToken: process.env.SLACK_APP_TOKEN,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle slash commands
    this.app.command(/.*/, async ({ command, ack, respond, say }) => {
      await ack();

      if (!this.commandHandler) return;

      const interaction = this.createInteractionFromCommand(command, { respond, say });
      await this.commandHandler(interaction);
    });

    // Handle button clicks
    this.app.action(/.*/, async ({ action, ack, respond, body }) => {
      await ack();

      if (!this.buttonHandler || !this.isButtonAction(action)) return;

      const buttonAction = action as ButtonAction;
      const interaction = this.createInteractionFromAction(body as any, { respond });
      await this.buttonHandler(interaction, buttonAction.action_id);
    });
  }

  private isButtonAction(action: any): action is ButtonAction {
    return action.type === 'button';
  }

  async start(): Promise<void> {
    try {
      await this.app.start();
      this.ready = true;
      logger.info('✅ Slack bot is running!');
    } catch (error) {
      logger.error('Failed to start Slack bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.app.stop();
    this.ready = false;
    logger.info('Slack bot stopped');
  }

  isReady(): boolean {
    return this.ready;
  }

  onCommand(handler: (interaction: IPlatformInteraction) => Promise<void>): void {
    this.commandHandler = handler;
  }

  onButton(handler: (interaction: IPlatformInteraction, buttonId: string) => Promise<void>): void {
    this.buttonHandler = handler;
  }

  async sendMessage(channelId: string, message: IPlatformMessage): Promise<void> {
    try {
      const blocks = this.convertMessageToBlocks(message);
      await this.app.client.chat.postMessage({
        channel: channelId,
        text: message.content,
        blocks,
        token: process.env.SLACK_BOT_TOKEN,
      });
    } catch (error) {
      logger.error('Failed to send Slack message:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<IPlatformUser | null> {
    try {
      const result = await this.app.client.users.info({
        user: userId,
        token: process.env.SLACK_BOT_TOKEN,
      });

      if (!result.user) return null;

      return {
        id: result.user.id!,
        username: result.user.name!,
        displayName: result.user.real_name,
        avatarUrl: result.user.profile?.image_512,
        platform: 'slack',
      };
    } catch (error) {
      logger.error('Failed to get Slack user:', error);
      return null;
    }
  }

  async getChannel(channelId: string): Promise<IPlatformChannel | null> {
    try {
      const result = await this.app.client.conversations.info({
        channel: channelId,
        token: process.env.SLACK_BOT_TOKEN,
      });

      if (!result.channel) return null;

      return {
        id: result.channel.id!,
        name: result.channel.name || 'DM',
        type: result.channel.is_im ? 'dm' : 'text',
        platform: 'slack',
      };
    } catch (error) {
      logger.error('Failed to get Slack channel:', error);
      return null;
    }
  }

  private createInteractionFromCommand(
    command: SlashCommand,
    responders: { respond: any; say: any }
  ): IPlatformInteraction {
    // Parse command options from text
    const parts = command.text.split(' ');
    const options: Record<string, any> = {};

    // Simple parsing - you might want to make this more sophisticated
    if (parts.length > 0 && parts[0]) {
      options.subcommand = parts[0];
      if (parts.length > 1) {
        options.query = parts.slice(1).join(' ');
      }
    }

    return {
      user: {
        id: command.user_id,
        username: command.user_name,
        platform: 'slack',
      },
      channel: {
        id: command.channel_id,
        name: command.channel_name,
        type: 'text',
        platform: 'slack',
      },
      guildId: command.team_id,
      commandName: command.command.replace('/', ''),
      options,
      platform: 'slack',

      reply: async (message: IPlatformMessage) => {
        const blocks = this.convertMessageToBlocks(message);
        await responders.respond({
          text: message.content,
          blocks,
          response_type: message.ephemeral ? 'ephemeral' : 'in_channel',
        });
      },

      deferReply: async (_ephemeral?: boolean) => {
        // Slack handles this with ack() which we already did
      },

      editReply: async (message: IPlatformMessage) => {
        const blocks = this.convertMessageToBlocks(message);
        await responders.respond({
          text: message.content,
          blocks,
          replace_original: true,
        });
      },

      followUp: async (message: IPlatformMessage) => {
        const blocks = this.convertMessageToBlocks(message);
        await responders.say({
          text: message.content,
          blocks,
        });
      },
    };
  }

  private createInteractionFromAction(
    body: any,
    responders: { respond: any }
  ): IPlatformInteraction {
    return {
      user: {
        id: body.user.id,
        username: body.user.username,
        platform: 'slack',
      },
      channel: {
        id: body.channel.id,
        name: body.channel.name,
        type: 'text',
        platform: 'slack',
      },
      guildId: body.team.id,
      commandName: '',
      options: {},
      platform: 'slack',

      reply: async (message: IPlatformMessage) => {
        const blocks = this.convertMessageToBlocks(message);
        await responders.respond({
          text: message.content,
          blocks,
          replace_original: false,
        });
      },

      deferReply: async (_ephemeral?: boolean) => {
        // Already handled by ack()
      },

      editReply: async (message: IPlatformMessage) => {
        const blocks = this.convertMessageToBlocks(message);
        await responders.respond({
          text: message.content,
          blocks,
          replace_original: true,
        });
      },

      followUp: async (message: IPlatformMessage) => {
        const blocks = this.convertMessageToBlocks(message);
        await this.app.client.chat.postMessage({
          channel: body.channel.id,
          text: message.content,
          blocks,
          token: process.env.SLACK_BOT_TOKEN,
        });
      },
    };
  }

  private convertMessageToBlocks(message: IPlatformMessage): any[] {
    const blocks: any[] = [];

    // Add main content
    if (message.content) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message.content,
        },
      });
    }

    // Convert embeds to Slack blocks
    if (message.embeds) {
      for (const embed of message.embeds) {
        blocks.push(...this.convertEmbedToBlocks(embed));
      }
    }

    // Add buttons as actions block
    if (message.buttons && message.buttons.length > 0) {
      blocks.push({
        type: 'actions',
        elements: message.buttons.map(button => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: button.label,
          },
          action_id: button.id,
          style: this.mapButtonStyle(button.style),
          url: button.url,
        })),
      });
    }

    return blocks;
  }

  private convertEmbedToBlocks(embed: IPlatformEmbed): any[] {
    const blocks: any[] = [];

    // Header with title
    if (embed.title) {
      blocks.push({
        type: 'header',
        text: {
          type: 'plain_text',
          text: embed.title,
        },
      });
    }

    // Main content with thumbnail
    const section: any = {
      type: 'section',
    };

    if (embed.description) {
      section.text = {
        type: 'mrkdwn',
        text: embed.description,
      };
    }

    if (embed.thumbnail) {
      section.accessory = {
        type: 'image',
        image_url: embed.thumbnail,
        alt_text: 'thumbnail',
      };
    }

    if (section.text || section.accessory) {
      blocks.push(section);
    }

    // Fields
    if (embed.fields && embed.fields.length > 0) {
      const fieldBlocks = embed.fields.map(field => ({
        type: 'mrkdwn',
        text: `*${field.name}*\n${field.value}`,
      }));

      // Slack allows max 10 fields per section
      for (let i = 0; i < fieldBlocks.length; i += 10) {
        blocks.push({
          type: 'section',
          fields: fieldBlocks.slice(i, i + 10),
        });
      }
    }

    // Image
    if (embed.image) {
      blocks.push({
        type: 'image',
        image_url: embed.image,
        alt_text: 'image',
      });
    }

    // Footer
    if (embed.footer) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: embed.footer.text,
          },
        ],
      });
    }

    // Divider for separation
    blocks.push({ type: 'divider' });

    return blocks;
  }

  private mapButtonStyle(style?: string): string {
    switch (style) {
      case 'primary':
        return 'primary';
      case 'danger':
        return 'danger';
      default:
        return undefined as any; // Slack default style
    }
  }
}