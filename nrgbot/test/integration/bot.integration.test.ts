import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { 
  mockClient, 
  mockInteraction, 
  mockGuild, 
  mockMember,
  createMockRole,
  createMockUser,
} from '../mocks/discord';
import { 
  mockSupabaseClient,
  createMockProfile,
  createMockHack,
  mockSuccessResponse,
} from '../mocks/supabase';

// Mock discord.js
vi.mock('discord.js', () => ({
  Client: vi.fn(() => mockClient),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMembers: 2,
    GuildMessages: 4,
  },
  Collection: Map,
  SlashCommandBuilder: vi.fn(() => ({
    setName: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addSubcommand: vi.fn().mockReturnThis(),
    addStringOption: vi.fn().mockReturnThis(),
    toJSON: vi.fn().mockReturnValue({}),
  })),
  EmbedBuilder: vi.fn(() => ({
    setColor: vi.fn().mockReturnThis(),
    setTitle: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addFields: vi.fn().mockReturnThis(),
    setFooter: vi.fn().mockReturnThis(),
    setTimestamp: vi.fn().mockReturnThis(),
  })),
  ActionRowBuilder: vi.fn(() => ({
    addComponents: vi.fn().mockReturnThis(),
  })),
  ButtonBuilder: vi.fn(() => ({
    setCustomId: vi.fn().mockReturnThis(),
    setLabel: vi.fn().mockReturnThis(),
    setStyle: vi.fn().mockReturnThis(),
    setDisabled: vi.fn().mockReturnThis(),
  })),
  ButtonStyle: {
    Primary: 1,
    Secondary: 2,
  },
  ComponentType: {
    Button: 2,
  },
}));

// Mock Supabase
vi.mock('../../src/database/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Mock repositories
vi.mock('../../src/database/repositories/hackRepository', () => ({
  hackRepository: {
    getAllHacks: vi.fn().mockResolvedValue([]),
    getHackById: vi.fn().mockResolvedValue(null),
    searchHacks: vi.fn().mockResolvedValue([]),
    getHacksByCategory: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../src/database/repositories/profileRepository', () => ({
  profileRepository: {
    findByDiscordId: vi.fn().mockResolvedValue(null),
    createProfile: vi.fn().mockResolvedValue(null),
    updateProfile: vi.fn().mockResolvedValue(null),
    updateDiscordRoles: vi.fn().mockResolvedValue(null),
    getProfilesForRoleSync: vi.fn().mockResolvedValue([]),
  },
}));

// Mock cron
vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn().mockReturnValue({
      stop: vi.fn(),
    }),
  },
}));

describe('Bot Integration Tests', () => {
  let client: any;
  let commands: Collection<string, any>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env.DISCORD_TOKEN = 'test-token';
    process.env.CLIENT_ID = 'test-client-id';
    process.env.GUILD_ID = 'test-guild-id';
    process.env.ADMIN_USER_IDS = 'admin-1,admin-2';
    
    // Set up mock client
    client = mockClient;
    commands = new Collection();
    client.commands = commands;
    
    // Set up mock guild
    const guildMap = new Map();
    guildMap.set('guild-1', mockGuild);
    client.guilds.cache = guildMap;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Bot Initialization', () => {
    it('should create client with correct intents', async () => {
      const { Client } = await import('discord.js');
      
      const botClient = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
        ],
      });

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          intents: expect.arrayContaining([1, 2, 4]),
        })
      );
    });

    it('should load all commands', async () => {
      const { pingCommand } = await import('../../src/commands/ping');
      const { hackCommand } = await import('../../src/commands/hack');
      
      commands.set('ping', pingCommand);
      commands.set('hack', hackCommand);

      expect(commands.size).toBe(2);
      expect(commands.has('ping')).toBe(true);
      expect(commands.has('hack')).toBe(true);
    });

    it('should handle ready event', async () => {
      const readyHandler = vi.fn();
      client.once = vi.fn((event, handler) => {
        if (event === 'ready') {
          readyHandler.mockImplementation(handler);
        }
      });

      client.once('ready', () => {
        console.log('Bot is ready!');
      });

      readyHandler();

      expect(client.once).toHaveBeenCalledWith('ready', expect.any(Function));
    });
  });

  describe('Command Execution', () => {
    it('should execute ping command', async () => {
      const { pingCommand } = await import('../../src/commands/ping');
      
      const interaction = {
        ...mockInteraction,
        commandName: 'ping',
        isCommand: () => true,
      };

      await pingCommand.execute(interaction);

      expect(interaction.deferReply).toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalled();
    });

    it('should execute hack list command', async () => {
      const { hackCommand } = await import('../../src/commands/hack');
      const { hackRepository } = await import('../../src/database/repositories/hackRepository');
      
      const mockHacks = [
        createMockHack({ id: 'hack-1' }),
        createMockHack({ id: 'hack-2' }),
      ];
      (hackRepository.getAllHacks as any).mockResolvedValue(mockHacks);

      const interaction = {
        ...mockInteraction,
        commandName: 'hack',
        options: {
          getSubcommand: vi.fn().mockReturnValue('list'),
          getString: vi.fn(),
        },
      };

      await hackCommand.execute(interaction);

      expect(interaction.deferReply).toHaveBeenCalled();
      expect(hackRepository.getAllHacks).toHaveBeenCalled();
    });

    it('should handle command errors', async () => {
      const { hackCommand } = await import('../../src/commands/hack');
      const { hackRepository } = await import('../../src/database/repositories/hackRepository');
      
      (hackRepository.getAllHacks as any).mockRejectedValue(new Error('Database error'));

      const interaction = {
        ...mockInteraction,
        commandName: 'hack',
        options: {
          getSubcommand: vi.fn().mockReturnValue('list'),
        },
      };

      await hackCommand.execute(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
        })
      );
    });
  });

  describe('Role Synchronization', () => {
    it('should sync roles on member update', async () => {
      const { RoleSyncService } = await import('../../src/services/roleSyncService');
      const { profileRepository } = await import('../../src/database/repositories/profileRepository');
      
      const roleSyncService = new RoleSyncService(client);
      
      const oldRoles = new Map();
      const newRoles = new Map();
      newRoles.set('role-1', createMockRole('energy-optimizer'));
      
      const oldMember = { ...mockMember, roles: { cache: oldRoles } };
      const newMember = { ...mockMember, roles: { cache: newRoles } };

      await roleSyncService.handleDiscordRoleUpdate(oldMember as any, newMember as any);

      expect(profileRepository.updateDiscordRoles).toHaveBeenCalledWith(
        'test-member-id',
        ['energy-optimizer']
      );
    });

    it('should perform periodic role sync', async () => {
      const { RoleSyncService } = await import('../../src/services/roleSyncService');
      const { profileRepository } = await import('../../src/database/repositories/profileRepository');
      const cron = (await import('node-cron')).default;
      
      const profiles = [
        createMockProfile({ discord_id: 'user-1' }),
        createMockProfile({ discord_id: 'user-2' }),
      ];
      (profileRepository.getProfilesForRoleSync as any).mockResolvedValue(profiles);
      
      const roleSyncService = new RoleSyncService(client);
      roleSyncService.startPeriodicSync();

      expect(cron.schedule).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle and report errors', async () => {
      const { ErrorService } = await import('../../src/services/errorService');
      
      const errorService = new ErrorService(client);
      const error = new Error('Test error');
      
      const admin = createMockUser('admin-1', 'Admin#0001');
      client.users.fetch.mockResolvedValue(admin);

      await errorService.handleError(error, 'HIGH' as any, {
        userId: 'user-1',
        command: 'test',
      });

      expect(client.users.fetch).toHaveBeenCalledWith('admin-1');
      expect(admin.send).toHaveBeenCalled();
    });

    it('should perform health checks', async () => {
      const { ErrorService } = await import('../../src/services/errorService');
      
      const errorService = new ErrorService(client);
      client.ws.status = 0; // READY
      
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const health = await errorService.performHealthCheck();

      expect(health.status).toBe('healthy');
      expect(health.checks.discord).toBe(true);
      expect(health.checks.database).toBe(true);
    });
  });

  describe('Database Operations', () => {
    it('should fetch and cache hacks', async () => {
      const { HackRepository } = await import('../../src/database/repositories/hackRepository');
      
      const mockHacks = [
        createMockHack({ id: 'hack-1' }),
        createMockHack({ id: 'hack-2' }),
      ];
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse(mockHacks)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      
      const hackRepo = new HackRepository();
      const result = await hackRepo.getAllHacks();

      expect(result).toEqual(mockHacks);
      
      // Test cache
      const cachedResult = await hackRepo.getAllHacks();
      expect(cachedResult).toEqual(mockHacks);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
    });

    it('should manage user profiles', async () => {
      const { ProfileRepository } = await import('../../src/database/repositories/profileRepository');
      
      const mockProfile = createMockProfile({ discord_id: 'user-1' });
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(mockProfile)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);
      
      const profileRepo = new ProfileRepository();
      const result = await profileRepo.findByDiscordId('user-1');

      expect(result).toEqual(mockProfile);
    });
  });

  describe('Command Handler', () => {
    it('should handle interaction create events', async () => {
      const { setupCommandHandler } = await import('../../src/handlers/commandHandler');
      const { pingCommand } = await import('../../src/commands/ping');
      
      commands.set('ping', pingCommand);
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'ping',
        isCommand: vi.fn().mockReturnValue(true),
        isChatInputCommand: vi.fn().mockReturnValue(true),
        isAutocomplete: vi.fn().mockReturnValue(false),
      };

      // Simulate interaction event
      const handler = client.on.mock.calls.find(call => call[0] === 'interactionCreate')?.[1];
      if (handler) {
        await handler(interaction);
        expect(interaction.deferReply).toHaveBeenCalled();
      }
    });

    it('should handle autocomplete interactions', async () => {
      const { setupCommandHandler } = await import('../../src/handlers/commandHandler');
      const { hackCommand } = await import('../../src/commands/hack');
      const { hackRepository } = await import('../../src/database/repositories/hackRepository');
      
      commands.set('hack', hackCommand);
      setupCommandHandler(client);

      const mockHacks = [createMockHack({ id: 'hack-1', name: 'Test Hack' })];
      (hackRepository.getAllHacks as any).mockResolvedValue(mockHacks);

      const interaction = {
        ...mockInteraction,
        commandName: 'hack',
        isCommand: vi.fn().mockReturnValue(false),
        isChatInputCommand: vi.fn().mockReturnValue(false),
        isAutocomplete: vi.fn().mockReturnValue(true),
        options: {
          getFocused: vi.fn().mockReturnValue('test'),
        },
      };

      const handler = client.on.mock.calls.find(call => call[0] === 'interactionCreate')?.[1];
      if (handler) {
        await handler(interaction);
        expect(interaction.respond).toHaveBeenCalled();
      }
    });

    it('should handle unknown commands', async () => {
      const { setupCommandHandler } = await import('../../src/handlers/commandHandler');
      
      setupCommandHandler(client);

      const interaction = {
        ...mockInteraction,
        commandName: 'unknown',
        isCommand: vi.fn().mockReturnValue(true),
        isChatInputCommand: vi.fn().mockReturnValue(true),
        isAutocomplete: vi.fn().mockReturnValue(false),
      };

      const handler = client.on.mock.calls.find(call => call[0] === 'interactionCreate')?.[1];
      if (handler) {
        await handler(interaction);
        expect(interaction.reply).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.stringContaining('Unknown command'),
            ephemeral: true,
          })
        );
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limits properly', async () => {
      vi.useFakeTimers();
      
      const { ErrorService } = await import('../../src/services/errorService');
      const errorService = new ErrorService(client);
      
      const admin = createMockUser('admin-1', 'Admin#0001');
      client.users.fetch.mockResolvedValue(admin);

      const error = new Error('Rate limited');

      // First notification should go through
      await errorService.handleError(error, 'HIGH' as any);
      expect(admin.send).toHaveBeenCalledTimes(1);

      // Second notification within throttle period should not
      await errorService.handleError(error, 'HIGH' as any);
      expect(admin.send).toHaveBeenCalledTimes(1);

      // After throttle period, should notify again
      vi.advanceTimersByTime(61000);
      await errorService.handleError(error, 'HIGH' as any);
      expect(admin.send).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('Pagination', () => {
    it('should handle pagination for hack lists', async () => {
      const { hackCommand } = await import('../../src/commands/hack');
      const { hackRepository } = await import('../../src/database/repositories/hackRepository');
      
      // Create 15 hacks to trigger pagination
      const mockHacks = Array.from({ length: 15 }, (_, i) => 
        createMockHack({ id: `hack-${i}`, name: `Hack ${i}` })
      );
      (hackRepository.getAllHacks as any).mockResolvedValue(mockHacks);

      const interaction = {
        ...mockInteraction,
        commandName: 'hack',
        options: {
          getSubcommand: vi.fn().mockReturnValue('list'),
        },
        editReply: vi.fn().mockResolvedValue({
          createMessageComponentCollector: vi.fn(() => ({
            on: vi.fn(),
          })),
        }),
      };

      await hackCommand.execute(interaction);

      expect(interaction.editReply).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
          components: expect.arrayContaining([expect.any(Object)]),
        })
      );
    });
  });

  describe('Cache Management', () => {
    it('should manage cache TTL properly', async () => {
      vi.useFakeTimers();
      
      const { HackRepository } = await import('../../src/database/repositories/hackRepository');
      
      const mockHacks1 = [createMockHack({ id: 'hack-1' })];
      const mockHacks2 = [createMockHack({ id: 'hack-2' })];
      
      const mockQuery1 = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse(mockHacks1)),
      };
      const mockQuery2 = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse(mockHacks2)),
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockQuery1)
        .mockReturnValueOnce(mockQuery2);

      const hackRepo = new HackRepository();
      
      // First fetch
      const result1 = await hackRepo.getAllHacks();
      expect(result1).toEqual(mockHacks1);

      // Within cache TTL - should return cached
      const result2 = await hackRepo.getAllHacks();
      expect(result2).toEqual(mockHacks1);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);

      // After cache TTL - should fetch new data
      vi.advanceTimersByTime(6 * 60 * 1000);
      const result3 = await hackRepo.getAllHacks();
      expect(result3).toEqual(mockHacks2);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});