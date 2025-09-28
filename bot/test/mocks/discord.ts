import { vi } from 'vitest';

export const mockClient = {
  ws: {
    ping: 50,
    status: 0,
  },
  guilds: {
    cache: new Map(),
  },
  users: {
    fetch: vi.fn(),
    cache: new Map(),
  },
  emit: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
};

export const mockGuild = {
  id: 'test-guild-id',
  name: 'Test Guild',
  members: {
    fetch: vi.fn(),
    me: {
      roles: {
        highest: {
          position: 10,
        },
      },
    },
  },
  roles: {
    cache: new Map(),
    create: vi.fn(),
  },
};

export const mockMember = {
  id: 'test-member-id',
  user: {
    id: 'test-user-id',
    tag: 'TestUser#0001',
  },
  guild: mockGuild,
  roles: {
    cache: new Map(),
    add: vi.fn(),
    remove: vi.fn(),
  },
};

export const mockInteraction = {
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
  guild: mockGuild,
  client: mockClient,
  deferReply: vi.fn().mockResolvedValue({
    createdTimestamp: Date.now(),
  }),
  editReply: vi.fn().mockResolvedValue({}),
  reply: vi.fn().mockResolvedValue({}),
  respond: vi.fn().mockResolvedValue({}),
  deferred: false,
  replied: false,
  createdTimestamp: Date.now() - 100,
};

export const mockMessage = {
  createMessageComponentCollector: vi.fn(() => ({
    on: vi.fn((event, callback) => {
      if (event === 'end') {
        setTimeout(() => callback(), 100);
      }
      return { on: vi.fn() };
    }),
  })),
};

export const mockButtonBuilder = () => ({
  setCustomId: vi.fn().mockReturnThis(),
  setLabel: vi.fn().mockReturnThis(),
  setStyle: vi.fn().mockReturnThis(),
  setDisabled: vi.fn().mockReturnThis(),
  setEmoji: vi.fn().mockReturnThis(),
});

export const mockActionRowBuilder = () => ({
  addComponents: vi.fn().mockReturnThis(),
  components: [],
});

export const mockEmbedBuilder = () => ({
  setColor: vi.fn().mockReturnThis(),
  setTitle: vi.fn().mockReturnThis(),
  setURL: vi.fn().mockReturnThis(),
  setDescription: vi.fn().mockReturnThis(),
  addFields: vi.fn().mockReturnThis(),
  setFooter: vi.fn().mockReturnThis(),
  setTimestamp: vi.fn().mockReturnThis(),
  setAuthor: vi.fn().mockReturnThis(),
  setImage: vi.fn().mockReturnThis(),
  setThumbnail: vi.fn().mockReturnThis(),
  toJSON: vi.fn().mockReturnValue({}),
});

export const mockSlashCommandBuilder = () => ({
  setName: vi.fn().mockReturnThis(),
  setDescription: vi.fn().mockReturnThis(),
  addSubcommand: vi.fn().mockReturnThis(),
  addStringOption: vi.fn().mockReturnThis(),
  addIntegerOption: vi.fn().mockReturnThis(),
  addBooleanOption: vi.fn().mockReturnThis(),
  addUserOption: vi.fn().mockReturnThis(),
  addChannelOption: vi.fn().mockReturnThis(),
  addRoleOption: vi.fn().mockReturnThis(),
  toJSON: vi.fn().mockReturnValue({}),
});

export const createMockRole = (name: string, position = 5) => ({
  id: `role-${name}`,
  name,
  position,
  managed: false,
  color: 0x000000,
});

export const createMockUser = (id: string, tag: string) => ({
  id,
  tag,
  send: vi.fn().mockResolvedValue({}),
});