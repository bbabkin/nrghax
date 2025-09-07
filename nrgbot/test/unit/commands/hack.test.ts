import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hackCommand } from '../../../src/commands/hack';
import { createMockHack } from '../../mocks/supabase';
import { CONSTANTS } from '../../../src/config/constants';

const mockHackRepository = {
  getAllHacks: vi.fn().mockResolvedValue([]),
  getHackById: vi.fn().mockResolvedValue(null),
  searchHacks: vi.fn().mockResolvedValue([]),
  getHacksByCategory: vi.fn().mockResolvedValue([]),
};

vi.mock('../../../src/database/repositories/hackRepository', () => ({
  hackRepository: mockHackRepository,
}));

describe('Hack Command', () => {
  let interaction: any;

  beforeEach(() => {
    interaction = {
      options: {
        getSubcommand: vi.fn(),
        getString: vi.fn(),
        getFocused: vi.fn(),
      },
      deferReply: vi.fn().mockResolvedValue({}),
      editReply: vi.fn().mockResolvedValue({
        createMessageComponentCollector: vi.fn(() => ({
          on: vi.fn((event, callback) => {
            if (event === 'end') {
              setTimeout(() => callback(), 100);
            }
            return { on: vi.fn() };
          }),
        })),
      }),
      reply: vi.fn().mockResolvedValue({}),
      respond: vi.fn().mockResolvedValue({}),
      deferred: false,
      replied: false,
      user: { id: 'test-user', tag: 'Test#0001' },
      client: { ws: { ping: 50 } },
    };
    
    // Reset all mocks
    mockHackRepository.getAllHacks.mockResolvedValue([]);
    mockHackRepository.getHackById.mockResolvedValue(null);
    mockHackRepository.searchHacks.mockResolvedValue([]);
    mockHackRepository.getHacksByCategory.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('List Subcommand', () => {
    it('should list all hacks', async () => {
      const mockHacks = [
        createMockHack({ id: 'hack-1', name: 'Hack 1' }),
        createMockHack({ id: 'hack-2', name: 'Hack 2' }),
      ];
      mockHackRepository.getAllHacks.mockResolvedValue(mockHacks);
      interaction.options.getSubcommand.mockReturnValue('list');

      await hackCommand.execute(interaction);

      expect(interaction.deferReply).toHaveBeenCalled();
      expect(mockHackRepository.getAllHacks).toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalled();
    });

    it('should handle empty hack list', async () => {
      mockHackRepository.getAllHacks.mockResolvedValue([]);
      interaction.options.getSubcommand.mockReturnValue('list');

      await hackCommand.execute(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
        })
      );
    });

    it('should paginate hacks when there are many', async () => {
      const mockHacks = Array.from({ length: 15 }, (_, i) => 
        createMockHack({ id: `hack-${i}`, name: `Hack ${i}` })
      );
      mockHackRepository.getAllHacks.mockResolvedValue(mockHacks);
      interaction.options.getSubcommand.mockReturnValue('list');

      await hackCommand.execute(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
          components: expect.any(Array),
        })
      );
    });
  });

  describe('Search Subcommand', () => {
    it('should search hacks by query', async () => {
      const mockHacks = [createMockHack({ name: 'Meditation' })];
      mockHackRepository.searchHacks.mockResolvedValue(mockHacks);
      interaction.options.getSubcommand.mockReturnValue('search');
      interaction.options.getString.mockReturnValue('meditation');

      await hackCommand.execute(interaction);

      expect(mockHackRepository.searchHacks).toHaveBeenCalledWith('meditation');
      expect(interaction.editReply).toHaveBeenCalled();
    });

    it('should handle no search results', async () => {
      mockHackRepository.searchHacks.mockResolvedValue([]);
      interaction.options.getSubcommand.mockReturnValue('search');
      interaction.options.getString.mockReturnValue('nonexistent');

      await hackCommand.execute(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.arrayContaining([expect.any(Object)]),
        })
      );
    });
  });

  describe('Category Subcommand', () => {
    it('should get hacks by category', async () => {
      const mockHacks = [createMockHack({ category: 'morning' })];
      mockHackRepository.getHacksByCategory.mockResolvedValue(mockHacks);
      interaction.options.getSubcommand.mockReturnValue('category');
      interaction.options.getString.mockReturnValue('morning');

      await hackCommand.execute(interaction);

      expect(mockHackRepository.getHacksByCategory).toHaveBeenCalledWith('morning');
      expect(interaction.editReply).toHaveBeenCalled();
    });

    it('should handle empty category', async () => {
      mockHackRepository.getHacksByCategory.mockResolvedValue([]);
      interaction.options.getSubcommand.mockReturnValue('category');
      interaction.options.getString.mockReturnValue('sleep');

      await hackCommand.execute(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
        })
      );
    });
  });

  describe('View Subcommand', () => {
    it('should view a specific hack', async () => {
      const mockHack = createMockHack({ id: 'hack-1' });
      mockHackRepository.getHackById.mockResolvedValue(mockHack);
      interaction.options.getSubcommand.mockReturnValue('view');
      interaction.options.getString.mockReturnValue('hack-1');

      await hackCommand.execute(interaction);

      expect(mockHackRepository.getHackById).toHaveBeenCalledWith('hack-1');
      expect(interaction.editReply).toHaveBeenCalled();
    });

    it('should handle hack not found', async () => {
      mockHackRepository.getHackById.mockResolvedValue(null);
      interaction.options.getSubcommand.mockReturnValue('view');
      interaction.options.getString.mockReturnValue('nonexistent');

      await hackCommand.execute(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
        })
      );
    });
  });

  describe('Autocomplete', () => {
    it('should provide autocomplete suggestions', async () => {
      const mockHacks = [
        createMockHack({ id: 'hack-1', name: 'Morning Meditation' }),
        createMockHack({ id: 'hack-2', name: 'Evening Routine' }),
      ];
      mockHackRepository.getAllHacks.mockResolvedValue(mockHacks);
      interaction.options.getFocused.mockReturnValue('morn');

      await hackCommand.autocomplete(interaction);

      expect(interaction.respond).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringContaining('Morning Meditation'),
            value: 'hack-1',
          }),
        ])
      );
    });

    it('should limit autocomplete results to 25', async () => {
      const mockHacks = Array.from({ length: 30 }, (_, i) => 
        createMockHack({ id: `hack-${i}`, name: `Hack ${i}` })
      );
      mockHackRepository.getAllHacks.mockResolvedValue(mockHacks);
      interaction.options.getFocused.mockReturnValue('');

      await hackCommand.autocomplete(interaction);

      expect(interaction.respond).toHaveBeenCalledWith(
        expect.arrayContaining(new Array(25).fill(expect.any(Object)))
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockHackRepository.getAllHacks.mockRejectedValue(new Error('Database error'));
      interaction.options.getSubcommand.mockReturnValue('list');

      await hackCommand.execute(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
        })
      );
    });

    it('should handle errors when already replied', async () => {
      mockHackRepository.getAllHacks.mockRejectedValue(new Error('Error'));
      interaction.options.getSubcommand.mockReturnValue('list');
      interaction.replied = true;

      await hackCommand.execute(interaction);

      expect(interaction.editReply).toHaveBeenCalled();
    });

    it('should handle errors when not deferred', async () => {
      mockHackRepository.getAllHacks.mockRejectedValue(new Error('Error'));
      interaction.options.getSubcommand.mockReturnValue('list');
      interaction.deferReply.mockRejectedValue(new Error('Defer failed'));

      await hackCommand.execute(interaction);

      expect(interaction.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
          ephemeral: true,
        })
      );
    });
  });
});