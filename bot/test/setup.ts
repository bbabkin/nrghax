import { vi } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables if not already set
process.env.NODE_ENV = 'test';
process.env.DISCORD_TOKEN = process.env.DISCORD_TOKEN || 'test-token';
process.env.CLIENT_ID = process.env.CLIENT_ID || 'test-client-id';
process.env.GUILD_ID = process.env.GUILD_ID || 'test-guild-id';
process.env.ADMIN_USER_IDS = process.env.ADMIN_USER_IDS || 'test-admin-1,test-admin-2';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

// Mock winston logger globally
vi.mock('winston', () => {
  const mockFormat = {
    combine: vi.fn().mockReturnThis(),
    timestamp: vi.fn().mockReturnThis(),
    errors: vi.fn().mockReturnThis(),
    splat: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    prettyPrint: vi.fn().mockReturnThis(),
    colorize: vi.fn().mockReturnThis(),
    simple: vi.fn().mockReturnThis(),
    printf: vi.fn().mockReturnThis(),
  };

  const mockTransports = {
    Console: vi.fn().mockImplementation(() => ({})),
    File: vi.fn().mockImplementation(() => ({})),
  };

  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    silly: vi.fn(),
    log: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    close: vi.fn(),
  };

  return {
    default: {
      format: mockFormat,
      transports: mockTransports,
      createLogger: vi.fn().mockReturnValue(mockLogger),
    },
    format: mockFormat,
    transports: mockTransports,
    createLogger: vi.fn().mockReturnValue(mockLogger),
  };
});

// Mock the logger module
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Discord.js globally
vi.mock('discord.js', () => {
  const mockEmbedBuilder = () => ({
    setColor: vi.fn().mockReturnThis(),
    setTitle: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addFields: vi.fn().mockReturnThis(),
    setFooter: vi.fn().mockReturnThis(),
    setTimestamp: vi.fn().mockReturnThis(),
    setAuthor: vi.fn().mockReturnThis(),
    setImage: vi.fn().mockReturnThis(),
    setThumbnail: vi.fn().mockReturnThis(),
    toJSON: vi.fn().mockReturnValue({}),
  });

  const mockSlashCommandBuilder = () => ({
    setName: vi.fn().mockReturnThis(),
    setDescription: vi.fn().mockReturnThis(),
    addSubcommand: vi.fn((callback) => {
      callback({
        setName: vi.fn().mockReturnThis(),
        setDescription: vi.fn().mockReturnThis(),
        addStringOption: vi.fn((callback) => {
          callback({
            setName: vi.fn().mockReturnThis(),
            setDescription: vi.fn().mockReturnThis(),
            setRequired: vi.fn().mockReturnThis(),
            setAutocomplete: vi.fn().mockReturnThis(),
            addChoices: vi.fn().mockReturnThis(),
          });
          return { setName: vi.fn().mockReturnThis() };
        }).mockReturnThis(),
      });
      return { addSubcommand: vi.fn().mockReturnThis() };
    }).mockReturnThis(),
    addStringOption: vi.fn().mockReturnThis(),
    addIntegerOption: vi.fn().mockReturnThis(),
    addBooleanOption: vi.fn().mockReturnThis(),
    toJSON: vi.fn().mockReturnValue({}),
  });

  const mockActionRowBuilder = () => ({
    addComponents: vi.fn().mockReturnThis(),
    components: [],
  });

  const mockButtonBuilder = () => ({
    setCustomId: vi.fn().mockReturnThis(),
    setLabel: vi.fn().mockReturnThis(),
    setStyle: vi.fn().mockReturnThis(),
    setDisabled: vi.fn().mockReturnThis(),
    setEmoji: vi.fn().mockReturnThis(),
  });

  return {
    Client: vi.fn(() => ({
      ws: { ping: 50, status: 0 },
      guilds: { cache: new Map() },
      users: { fetch: vi.fn(), cache: new Map() },
      emit: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      commands: new Map(),
    })),
    GatewayIntentBits: {
      Guilds: 1,
      GuildMembers: 2,
      GuildMessages: 4,
    },
    Collection: Map,
    SlashCommandBuilder: vi.fn(mockSlashCommandBuilder),
    EmbedBuilder: vi.fn(mockEmbedBuilder),
    ActionRowBuilder: vi.fn(mockActionRowBuilder),
    ButtonBuilder: vi.fn(mockButtonBuilder),
    ButtonStyle: {
      Primary: 1,
      Secondary: 2,
      Success: 3,
      Danger: 4,
      Link: 5,
    },
    ComponentType: {
      Button: 2,
    },
  };
});

// Global test utilities
global.createMockInteraction = () => {
  return {
    commandName: 'test',
    options: {
      getSubcommand: vi.fn(),
      getString: vi.fn(),
      getFocused: vi.fn(),
    },
    user: {
      id: 'test-user-id',
      tag: 'TestUser#0001',
    },
    guild: {
      id: 'test-guild-id',
      name: 'Test Guild',
    },
    client: {
      ws: {
        ping: 50,
        status: 0,
      },
      guilds: {
        cache: new Map(),
      },
      users: {
        fetch: vi.fn(),
      },
    },
    deferReply: vi.fn().mockResolvedValue({
      createdTimestamp: Date.now(),
    }),
    editReply: vi.fn(),
    reply: vi.fn(),
    respond: vi.fn(),
    deferred: false,
    replied: false,
    createdTimestamp: Date.now() - 100,
  };
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});