import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  Collection,
  PermissionResolvable,
  AutocompleteInteraction,
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  cooldown?: number;
  permissions?: PermissionResolvable[];
  guildOnly?: boolean;
  dmOnly?: boolean;
}

export interface BotClient {
  commands: Collection<string, Command>;
  cooldowns: Collection<string, Collection<string, number>>;
}