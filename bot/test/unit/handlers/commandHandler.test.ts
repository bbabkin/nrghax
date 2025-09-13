import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupCommandHandler } from '../../../src/handlers/commandHandler';
import { mockClient, mockInteraction } from '../../mocks/discord';

vi.mock('discord.js', () => ({
  Collection: Map,
}));

describe('Command Handler', () => {
  let client: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    client = {
      ...mockClient,
      commands: new Map(),
      on: vi.fn(),
    };
  });

  describe('Setup', () => {
    it('should register interaction create event', () => {
      setupCommandHandler(client);

      expect(client.on).toHaveBeenCalledWith(
        'interactionCreate',
        expect.any(Function)
      );
    });
  });

  describe('Chat Input Commands', () => {
    it('should execute chat input commands', async () => {
      const mockCommand = {
        execute: vi.fn().mockResolvedValue(undefined),
      };
      
      client.commands.set('test', mockCommand);
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'test',
        isChatInputCommand: vi.fn().mockReturnValue(true),
        isAutocomplete: vi.fn().mockReturnValue(false),
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      expect(mockCommand.execute).toHaveBeenCalledWith(interaction);
    });

    it('should handle missing commands', async () => {
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'nonexistent',
        isChatInputCommand: vi.fn().mockReturnValue(true),
        isAutocomplete: vi.fn().mockReturnValue(false),
        reply: vi.fn().mockResolvedValue(undefined),
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Unknown command!',
          ephemeral: true,
        })
      );
    });

    it('should handle command execution errors', async () => {
      const mockCommand = {
        execute: vi.fn().mockRejectedValue(new Error('Command failed')),
      };
      
      client.commands.set('test', mockCommand);
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'test',
        isChatInputCommand: vi.fn().mockReturnValue(true),
        isAutocomplete: vi.fn().mockReturnValue(false),
        reply: vi.fn().mockResolvedValue(undefined),
        followUp: vi.fn().mockResolvedValue(undefined),
        replied: false,
        deferred: false,
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'There was an error executing this command!',
          ephemeral: true,
        })
      );
    });

    it('should handle errors when already replied', async () => {
      const mockCommand = {
        execute: vi.fn().mockRejectedValue(new Error('Command failed')),
      };
      
      client.commands.set('test', mockCommand);
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'test',
        isChatInputCommand: vi.fn().mockReturnValue(true),
        isAutocomplete: vi.fn().mockReturnValue(false),
        followUp: vi.fn().mockResolvedValue(undefined),
        replied: true,
        deferred: false,
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'There was an error executing this command!',
          ephemeral: true,
        })
      );
    });

    it('should handle errors when deferred', async () => {
      const mockCommand = {
        execute: vi.fn().mockRejectedValue(new Error('Command failed')),
      };
      
      client.commands.set('test', mockCommand);
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'test',
        isChatInputCommand: vi.fn().mockReturnValue(true),
        isAutocomplete: vi.fn().mockReturnValue(false),
        followUp: vi.fn().mockResolvedValue(undefined),
        replied: false,
        deferred: true,
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      expect(interaction.followUp).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'There was an error executing this command!',
          ephemeral: true,
        })
      );
    });
  });

  describe('Autocomplete', () => {
    it('should handle autocomplete interactions', async () => {
      const mockCommand = {
        autocomplete: vi.fn().mockResolvedValue(undefined),
      };
      
      client.commands.set('test', mockCommand);
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'test',
        isChatInputCommand: vi.fn().mockReturnValue(false),
        isAutocomplete: vi.fn().mockReturnValue(true),
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      expect(mockCommand.autocomplete).toHaveBeenCalledWith(interaction);
    });

    it('should handle missing autocomplete handler', async () => {
      const mockCommand = {
        execute: vi.fn(),
        // No autocomplete handler
      };
      
      client.commands.set('test', mockCommand);
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'test',
        isChatInputCommand: vi.fn().mockReturnValue(false),
        isAutocomplete: vi.fn().mockReturnValue(true),
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      // Should not throw
      expect(mockCommand.execute).not.toHaveBeenCalled();
    });

    it('should handle autocomplete errors', async () => {
      const mockCommand = {
        autocomplete: vi.fn().mockRejectedValue(new Error('Autocomplete failed')),
      };
      
      client.commands.set('test', mockCommand);
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'test',
        isChatInputCommand: vi.fn().mockReturnValue(false),
        isAutocomplete: vi.fn().mockReturnValue(true),
      };

      const handler = client.on.mock.calls[0][1];
      
      // Should not throw
      await expect(handler(interaction)).resolves.toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-command interactions', async () => {
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        isChatInputCommand: vi.fn().mockReturnValue(false),
        isAutocomplete: vi.fn().mockReturnValue(false),
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      // Should not process non-command interactions
      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it('should handle undefined command name', async () => {
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: undefined,
        isChatInputCommand: vi.fn().mockReturnValue(true),
        isAutocomplete: vi.fn().mockReturnValue(false),
        reply: vi.fn().mockResolvedValue(undefined),
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Unknown command!',
          ephemeral: true,
        })
      );
    });

    it('should handle null command', async () => {
      client.commands.set('test', null);
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'test',
        isChatInputCommand: vi.fn().mockReturnValue(true),
        isAutocomplete: vi.fn().mockReturnValue(false),
        reply: vi.fn().mockResolvedValue(undefined),
      };

      const handler = client.on.mock.calls[0][1];
      await handler(interaction);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Unknown command!',
          ephemeral: true,
        })
      );
    });
  });
});