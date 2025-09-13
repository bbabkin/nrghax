import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((callback) => callback({ data: [], error: null })),
    execute: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
    })),
  },
};

export const createMockProfile = (overrides = {}) => ({
  id: 'profile-1',
  username: 'testuser',
  discord_id: 'test-user-id',
  discord_roles: ['member'],
  energy_score: 100,
  streak_days: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockHack = (overrides = {}) => ({
  id: 'hack-1',
  name: 'Morning Meditation',
  description: 'Start your day with 10 minutes of meditation',
  category: 'mindfulness',
  difficulty: 'beginner',
  energy_impact: 15,
  time_investment: '10 minutes',
  requirements: ['Quiet space', 'Meditation app'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const mockSuccessResponse = (data: any) => ({
  data,
  error: null,
});

export const mockErrorResponse = (message: string) => ({
  data: null,
  error: {
    message,
    details: null,
    hint: null,
    code: 'PGRST001',
  },
});

export const mockHackRepository = {
  getAllHacks: vi.fn().mockResolvedValue([]),
  getHackById: vi.fn().mockResolvedValue(null),
  searchHacks: vi.fn().mockResolvedValue([]),
  getHacksByCategory: vi.fn().mockResolvedValue([]),
  createHack: vi.fn().mockResolvedValue(null),
  updateHack: vi.fn().mockResolvedValue(null),
  deleteHack: vi.fn().mockResolvedValue(true),
};

export const mockProfileRepository = {
  findByDiscordId: vi.fn().mockResolvedValue(null),
  createProfile: vi.fn().mockResolvedValue(null),
  updateProfile: vi.fn().mockResolvedValue(null),
  updateDiscordRoles: vi.fn().mockResolvedValue(null),
  getProfilesForRoleSync: vi.fn().mockResolvedValue([]),
  updateEnergyScore: vi.fn().mockResolvedValue(null),
  updateStreak: vi.fn().mockResolvedValue(null),
};