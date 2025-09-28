/**
 * Platform abstraction interface for multi-platform bot support
 */

export interface IPlatformUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  platform: 'discord' | 'slack';
}

export interface IPlatformChannel {
  id: string;
  name: string;
  type: 'text' | 'dm' | 'voice';
  platform: 'discord' | 'slack';
}

export interface IPlatformMessage {
  content: string;
  embeds?: IPlatformEmbed[];
  buttons?: IPlatformButton[];
  ephemeral?: boolean;
}

export interface IPlatformEmbed {
  title?: string;
  description?: string;
  color?: number | string;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  thumbnail?: string;
  image?: string;
  footer?: {
    text: string;
    iconUrl?: string;
  };
  timestamp?: Date | string;
}

export interface IPlatformButton {
  id: string;
  label: string;
  style?: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
  url?: string;
  disabled?: boolean;
}

export interface IPlatformInteraction {
  user: IPlatformUser;
  channel: IPlatformChannel;
  guildId?: string;
  commandName: string;
  options: Record<string, any>;
  platform: 'discord' | 'slack';

  reply(message: IPlatformMessage): Promise<void>;
  deferReply(ephemeral?: boolean): Promise<void>;
  editReply(message: IPlatformMessage): Promise<void>;
  followUp(message: IPlatformMessage): Promise<void>;
}

export interface IPlatformClient {
  platform: 'discord' | 'slack';

  start(): Promise<void>;
  stop(): Promise<void>;

  isReady(): boolean;

  onCommand(handler: (interaction: IPlatformInteraction) => Promise<void>): void;
  onButton(handler: (interaction: IPlatformInteraction, buttonId: string) => Promise<void>): void;

  sendMessage(channelId: string, message: IPlatformMessage): Promise<void>;

  getUser(userId: string): Promise<IPlatformUser | null>;
  getChannel(channelId: string): Promise<IPlatformChannel | null>;
}