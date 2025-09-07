import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileRepository } from '../../../src/database/repositories/profileRepository';
import { 
  mockSupabaseClient, 
  createMockProfile, 
  mockSuccessResponse, 
  mockErrorResponse 
} from '../../mocks/supabase';

vi.mock('../../../src/database/supabase', () => ({
  supabase: mockSupabaseClient,
}));

describe('ProfileRepository', () => {
  let profileRepository: ProfileRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    profileRepository = new ProfileRepository();
    
    // Reset mock implementations
    mockSupabaseClient.from = vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccessResponse(null)),
      then: vi.fn((callback) => callback(mockSuccessResponse([]))),
    }));
  });

  describe('findByDiscordId', () => {
    it('should find profile by Discord ID', async () => {
      const mockProfile = createMockProfile({ discord_id: 'user-123' });
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(mockProfile)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.findByDiscordId('user-123');

      expect(result).toEqual(mockProfile);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.eq).toHaveBeenCalledWith('discord_id', 'user-123');
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should return null when profile not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockErrorResponse('Not found')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.findByDiscordId('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.findByDiscordId('user-123');

      expect(result).toBeNull();
    });
  });

  describe('createProfile', () => {
    it('should create a new profile', async () => {
      const profileData = {
        username: 'testuser',
        discord_id: 'user-123',
        discord_username: 'TestUser#0001',
      };
      const mockProfile = createMockProfile(profileData);
      
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(mockProfile)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.createProfile(profileData);

      expect(result).toEqual(mockProfile);
      expect(mockQuery.insert).toHaveBeenCalledWith(profileData);
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const profileData = {
        username: 'testuser',
        discord_id: 'user-123',
      };
      
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockErrorResponse('Duplicate key')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.createProfile(profileData);

      expect(result).toBeNull();
    });

    it('should handle missing required fields', async () => {
      const profileData = { username: 'testuser' };
      
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockErrorResponse('Invalid data')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.createProfile(profileData as any);

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile by Discord ID', async () => {
      const updates = { energy_score: 150, streak_days: 10 };
      const updatedProfile = createMockProfile({ ...updates, discord_id: 'user-123' });
      
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(updatedProfile)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateProfile('user-123', updates);

      expect(result).toEqual(updatedProfile);
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('discord_id', 'user-123');
    });

    it('should handle update errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockErrorResponse('Update failed')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateProfile('user-123', { energy_score: 100 });

      expect(result).toBeNull();
    });

    it('should handle empty updates', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(createMockProfile())),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateProfile('user-123', {});

      expect(result).toBeDefined();
      expect(mockQuery.update).toHaveBeenCalledWith({});
    });
  });

  describe('updateDiscordRoles', () => {
    it('should update Discord roles', async () => {
      const roles = ['member', 'energy-optimizer'];
      const updatedProfile = createMockProfile({ discord_roles: roles });
      
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(updatedProfile)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateDiscordRoles('user-123', roles);

      expect(result).toEqual(updatedProfile);
      expect(mockQuery.update).toHaveBeenCalledWith({ 
        discord_roles: roles,
        updated_at: expect.any(String),
      });
    });

    it('should handle empty roles array', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(createMockProfile({ discord_roles: [] }))),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateDiscordRoles('user-123', []);

      expect(result).toBeDefined();
      expect(mockQuery.update).toHaveBeenCalledWith({ 
        discord_roles: [],
        updated_at: expect.any(String),
      });
    });

    it('should handle role update errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockErrorResponse('Update failed')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateDiscordRoles('user-123', ['admin']);

      expect(result).toBeNull();
    });
  });

  describe('getProfilesForRoleSync', () => {
    it('should fetch profiles with Discord IDs and roles', async () => {
      const mockProfiles = [
        createMockProfile({ discord_id: 'user-1', discord_roles: ['member'] }),
        createMockProfile({ discord_id: 'user-2', discord_roles: ['admin'] }),
      ];
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue(mockSuccessResponse(mockProfiles)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.getProfilesForRoleSync();

      expect(result).toEqual(mockProfiles);
      expect(mockQuery.select).toHaveBeenCalledWith('discord_id, discord_roles');
      expect(mockQuery.not).toHaveBeenCalledWith('discord_id', 'is', null);
    });

    it('should handle empty results', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue(mockSuccessResponse([])),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.getProfilesForRoleSync();

      expect(result).toEqual([]);
    });

    it('should handle fetch errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValue(mockErrorResponse('Query failed')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.getProfilesForRoleSync();

      expect(result).toEqual([]);
    });
  });

  describe('updateEnergyScore', () => {
    it('should update energy score', async () => {
      const updatedProfile = createMockProfile({ energy_score: 200 });
      
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(updatedProfile)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateEnergyScore('user-123', 200);

      expect(result).toEqual(updatedProfile);
      expect(mockQuery.update).toHaveBeenCalledWith({ 
        energy_score: 200,
        updated_at: expect.any(String),
      });
    });

    it('should handle negative energy scores', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(createMockProfile({ energy_score: 0 }))),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateEnergyScore('user-123', -10);

      expect(result).toBeDefined();
      expect(mockQuery.update).toHaveBeenCalledWith({ 
        energy_score: -10,
        updated_at: expect.any(String),
      });
    });

    it('should handle very large energy scores', async () => {
      const largeScore = 999999;
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(createMockProfile({ energy_score: largeScore }))),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateEnergyScore('user-123', largeScore);

      expect(result).toBeDefined();
      expect(mockQuery.update).toHaveBeenCalledWith({ 
        energy_score: largeScore,
        updated_at: expect.any(String),
      });
    });
  });

  describe('updateStreak', () => {
    it('should update streak days', async () => {
      const updatedProfile = createMockProfile({ streak_days: 30 });
      
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(updatedProfile)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateStreak('user-123', 30);

      expect(result).toEqual(updatedProfile);
      expect(mockQuery.update).toHaveBeenCalledWith({ 
        streak_days: 30,
        last_streak_update: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should handle zero streak', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(createMockProfile({ streak_days: 0 }))),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateStreak('user-123', 0);

      expect(result).toBeDefined();
      expect(mockQuery.update).toHaveBeenCalledWith({ 
        streak_days: 0,
        last_streak_update: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should handle streak update errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockErrorResponse('Update failed')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.updateStreak('user-123', 10);

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null Discord ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockErrorResponse('Invalid input')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.findByDiscordId(null as any);

      expect(result).toBeNull();
    });

    it('should handle undefined Discord ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockErrorResponse('Invalid input')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.findByDiscordId(undefined as any);

      expect(result).toBeNull();
    });

    it('should handle network timeout', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => 
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
        ),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.findByDiscordId('user-123');

      expect(result).toBeNull();
    });

    it('should handle malformed profile data', async () => {
      const malformedData = { id: 'profile-1' }; // Missing required fields
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(malformedData)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await profileRepository.findByDiscordId('user-123');

      expect(result).toEqual(malformedData);
    });
  });
});