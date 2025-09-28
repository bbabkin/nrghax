import { IPlatformInteraction } from '../interfaces/IPlatform';

export interface CommandOption {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'user' | 'channel';
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
}

export interface CommandSubcommand {
  name: string;
  description: string;
  options?: CommandOption[];
}

export interface CommandDefinition {
  name: string;
  description: string;
  subcommands?: CommandSubcommand[];
  options?: CommandOption[];
}

export abstract class BaseCommand {
  abstract definition: CommandDefinition;

  abstract execute(interaction: IPlatformInteraction): Promise<void>;

  /**
   * Helper to get option value safely
   */
  protected getOption<T = any>(
    interaction: IPlatformInteraction,
    name: string,
    defaultValue?: T
  ): T {
    return interaction.options[name] ?? defaultValue;
  }

  /**
   * Helper to get subcommand
   */
  protected getSubcommand(interaction: IPlatformInteraction): string | undefined {
    return interaction.options.subcommand;
  }
}