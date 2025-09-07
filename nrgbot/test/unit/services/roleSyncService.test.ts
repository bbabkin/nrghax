import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RoleSyncService } from '../../../src/services/roleSyncService';
import { 
  mockClient, 
  mockGuild, 
  mockMember, 
  createMockRole 
} from '../../mocks/discord';
import { 
  mockProfileRepository, 
  createMockProfile 
} from '../../mocks/supabase';
import cron from 'node-cron';

vi.mock('../../../src/database/repositories/profileRepository', () => ({
  profileRepository: mockProfileRepository,
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn().mockReturnValue({
      stop: vi.fn(),
    }),
  },
}));

describe('RoleSyncService', () => {
  let roleSyncService: RoleSyncService;
  let mockGuildMap: Map<string, any>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env.ROLE_SYNC_INTERVAL_MINUTES = '30';
    
    // Set up mock guild map
    mockGuildMap = new Map();
    mockGuildMap.set('guild-1', mockGuild);
    mockClient.guilds.cache = mockGuildMap;
    
    // Reset mock implementations
    mockGuild.members.fetch = vi.fn().mockResolvedValue(mockMember);
    mockMember.roles.add = vi.fn().mockResolvedValue(undefined);
    mockMember.roles.remove = vi.fn().mockResolvedValue(undefined);
    mockGuild.roles.create = vi.fn().mockResolvedValue({});
    
    roleSyncService = new RoleSyncService(mockClient as any);
  });

  afterEach(() => {
    roleSyncService.stopPeriodicSync();
  });

  describe('Periodic Sync', () => {
    it('should start periodic sync with correct interval', () => {
      roleSyncService.startPeriodicSync();

      expect(cron.schedule).toHaveBeenCalledWith(
        '*/30 * * * *',
        expect.any(Function)
      );
    });

    it('should use default interval when not configured', () => {
      delete process.env.ROLE_SYNC_INTERVAL_MINUTES;
      roleSyncService = new RoleSyncService(mockClient as any);
      
      roleSyncService.startPeriodicSync();

      expect(cron.schedule).toHaveBeenCalledWith(
        '*/30 * * * *',
        expect.any(Function)
      );
    });

    it('should stop periodic sync', () => {
      const mockTask = { stop: vi.fn() };
      (cron.schedule as any).mockReturnValue(mockTask);
      
      roleSyncService.startPeriodicSync();
      roleSyncService.stopPeriodicSync();

      expect(mockTask.stop).toHaveBeenCalled();
    });

    it('should handle stop when no task is running', () => {
      roleSyncService.stopPeriodicSync();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Sync All Roles', () => {
    it('should sync roles for all profiles', async () => {
      const profiles = [
        createMockProfile({ discord_id: 'user-1' }),
        createMockProfile({ discord_id: 'user-2' }),
      ];
      mockProfileRepository.getProfilesForRoleSync.mockResolvedValue(profiles);
      mockProfileRepository.findByDiscordId.mockResolvedValue(profiles[0]);

      await roleSyncService.syncAllRoles();

      expect(mockProfileRepository.getProfilesForRoleSync).toHaveBeenCalled();
      expect(mockProfileRepository.findByDiscordId).toHaveBeenCalledTimes(2);
    });

    it('should skip profiles without Discord ID', async () => {
      const profiles = [
        createMockProfile({ discord_id: null }),
        createMockProfile({ discord_id: 'user-1' }),
      ];
      mockProfileRepository.getProfilesForRoleSync.mockResolvedValue(profiles);
      mockProfileRepository.findByDiscordId.mockResolvedValue(profiles[1]);

      await roleSyncService.syncAllRoles();

      expect(mockProfileRepository.findByDiscordId).toHaveBeenCalledTimes(1);
    });

    it('should handle sync errors gracefully', async () => {
      const profiles = [createMockProfile({ discord_id: 'user-1' })];
      mockProfileRepository.getProfilesForRoleSync.mockResolvedValue(profiles);
      mockProfileRepository.findByDiscordId.mockRejectedValue(new Error('Sync error'));

      await roleSyncService.syncAllRoles();

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle repository errors', async () => {
      mockProfileRepository.getProfilesForRoleSync.mockRejectedValue(new Error('DB error'));

      await roleSyncService.syncAllRoles();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Sync User Roles', () => {
    it('should sync roles for a specific user', async () => {
      const profile = createMockProfile({
        discord_id: 'user-1',
        discord_roles: ['energy-optimizer', 'morning-person'],
      });
      mockProfileRepository.findByDiscordId.mockResolvedValue(profile);

      await roleSyncService.syncUserRoles('user-1');

      expect(mockGuild.members.fetch).toHaveBeenCalledWith('user-1');
    });

    it('should handle missing profile', async () => {
      mockProfileRepository.findByDiscordId.mockResolvedValue(null);

      await roleSyncService.syncUserRoles('nonexistent');

      expect(mockGuild.members.fetch).not.toHaveBeenCalled();
    });

    it('should handle member not in guild', async () => {
      const profile = createMockProfile({ discord_id: 'user-1' });
      mockProfileRepository.findByDiscordId.mockResolvedValue(profile);
      mockGuild.members.fetch.mockRejectedValue(new Error('Member not found'));

      await roleSyncService.syncUserRoles('user-1');

      // Should not throw
      expect(true).toBe(true);
    });

    it('should sync across multiple guilds', async () => {
      const guild2 = { ...mockGuild, id: 'guild-2' };
      mockGuildMap.set('guild-2', guild2);
      
      const profile = createMockProfile({ discord_id: 'user-1' });
      mockProfileRepository.findByDiscordId.mockResolvedValue(profile);

      await roleSyncService.syncUserRoles('user-1');

      expect(mockGuild.members.fetch).toHaveBeenCalledWith('user-1');
      expect(guild2.members.fetch).toHaveBeenCalledWith('user-1');
    });
  });

  describe('Discord Role Update', () => {
    it('should handle Discord role updates', async () => {
      const oldRoles = new Map();
      oldRoles.set('role-1', createMockRole('member'));
      
      const newRoles = new Map();
      newRoles.set('role-1', createMockRole('member'));
      newRoles.set('role-2', createMockRole('energy-optimizer'));
      
      const oldMember = { ...mockMember, roles: { cache: oldRoles } };
      const newMember = { ...mockMember, roles: { cache: newRoles } };

      await roleSyncService.handleDiscordRoleUpdate(oldMember as any, newMember as any);

      expect(mockProfileRepository.updateDiscordRoles).toHaveBeenCalledWith(
        'test-member-id',
        ['member', 'energy-optimizer']
      );
    });

    it('should not update when roles unchanged', async () => {
      const roles = new Map();
      roles.set('role-1', createMockRole('member'));
      
      const oldMember = { ...mockMember, roles: { cache: roles } };
      const newMember = { ...mockMember, roles: { cache: roles } };

      await roleSyncService.handleDiscordRoleUpdate(oldMember as any, newMember as any);

      expect(mockProfileRepository.updateDiscordRoles).not.toHaveBeenCalled();
    });

    it('should emit custom event on role change', async () => {
      const oldRoles = new Map();
      const newRoles = new Map();
      newRoles.set('role-1', createMockRole('energy-optimizer'));
      
      const oldMember = { ...mockMember, roles: { cache: oldRoles } };
      const newMember = { ...mockMember, roles: { cache: newRoles } };

      await roleSyncService.handleDiscordRoleUpdate(oldMember as any, newMember as any);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'nrgRoleSync',
        expect.objectContaining({
          userId: 'test-member-id',
          oldRoles: [],
          newRoles: ['energy-optimizer'],
        })
      );
    });

    it('should handle update errors gracefully', async () => {
      const oldRoles = new Map();
      const newRoles = new Map();
      newRoles.set('role-1', createMockRole('new-role'));
      
      const oldMember = { ...mockMember, roles: { cache: oldRoles } };
      const newMember = { ...mockMember, roles: { cache: newRoles } };
      
      mockProfileRepository.updateDiscordRoles.mockRejectedValue(new Error('Update failed'));

      await roleSyncService.handleDiscordRoleUpdate(oldMember as any, newMember as any);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Role Management', () => {
    it('should add missing NRG roles to member', async () => {
      const memberRoles = new Map();
      memberRoles.set('role-1', createMockRole('member'));
      mockMember.roles.cache = memberRoles;
      
      const guildRoles = new Map();
      guildRoles.set('role-2', createMockRole('energy-optimizer', 5));
      mockGuild.roles.cache = guildRoles;
      
      const profile = createMockProfile({
        discord_id: 'user-1',
        discord_roles: ['energy-optimizer'],
      });
      mockProfileRepository.findByDiscordId.mockResolvedValue(profile);

      await roleSyncService.syncUserRoles('user-1');

      expect(mockMember.roles.add).toHaveBeenCalled();
    });

    it('should remove NRG roles not in profile', async () => {
      const memberRoles = new Map();
      memberRoles.set('role-1', createMockRole('energy-optimizer', 5));
      mockMember.roles.cache = memberRoles;
      
      const profile = createMockProfile({
        discord_id: 'user-1',
        discord_roles: [],
      });
      mockProfileRepository.findByDiscordId.mockResolvedValue(profile);

      await roleSyncService.syncUserRoles('user-1');

      expect(mockMember.roles.remove).toHaveBeenCalled();
    });

    it('should not modify managed roles', async () => {
      const managedRole = createMockRole('managed-role');
      managedRole.managed = true;
      
      const memberRoles = new Map();
      memberRoles.set('role-1', managedRole);
      mockMember.roles.cache = memberRoles;
      
      const profile = createMockProfile({
        discord_id: 'user-1',
        discord_roles: [],
      });
      mockProfileRepository.findByDiscordId.mockResolvedValue(profile);

      await roleSyncService.syncUserRoles('user-1');

      expect(mockMember.roles.remove).not.toHaveBeenCalled();
    });

    it('should not modify roles above bot position', async () => {
      const highRole = createMockRole('high-role', 15);
      
      const memberRoles = new Map();
      memberRoles.set('role-1', highRole);
      mockMember.roles.cache = memberRoles;
      
      const profile = createMockProfile({
        discord_id: 'user-1',
        discord_roles: [],
      });
      mockProfileRepository.findByDiscordId.mockResolvedValue(profile);

      await roleSyncService.syncUserRoles('user-1');

      expect(mockMember.roles.remove).not.toHaveBeenCalled();
    });
  });

  describe('Ensure NRG Roles', () => {
    it('should create missing NRG roles in guild', async () => {
      mockGuild.roles.cache = new Map();

      await roleSyncService.ensureNRGRoles(mockGuild as any);

      expect(mockGuild.roles.create).toHaveBeenCalledTimes(8);
      expect(mockGuild.roles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'energy-optimizer',
        })
      );
    });

    it('should not create existing roles', async () => {
      const existingRoles = new Map();
      existingRoles.set('role-1', createMockRole('energy-optimizer'));
      mockGuild.roles.cache = existingRoles;

      await roleSyncService.ensureNRGRoles(mockGuild as any);

      // Should create 7 roles (8 total - 1 existing)
      expect(mockGuild.roles.create).toHaveBeenCalledTimes(7);
    });

    it('should handle role creation failures', async () => {
      mockGuild.roles.cache = new Map();
      mockGuild.roles.create.mockRejectedValue(new Error('Insufficient permissions'));

      await roleSyncService.ensureNRGRoles(mockGuild as any);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should create roles with correct colors', async () => {
      mockGuild.roles.cache = new Map();

      await roleSyncService.ensureNRGRoles(mockGuild as any);

      expect(mockGuild.roles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'morning-person',
          color: 0xFBBF24,
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty discord_roles array', async () => {
      const profile = createMockProfile({
        discord_id: 'user-1',
        discord_roles: null,
      });
      mockProfileRepository.findByDiscordId.mockResolvedValue(profile);

      await roleSyncService.syncUserRoles('user-1');

      // Should not throw
      expect(true).toBe(true);
    });

    it('should exclude @everyone role', async () => {
      const roles = new Map();
      roles.set('role-1', { ...createMockRole('@everyone'), name: '@everyone' });
      roles.set('role-2', createMockRole('member'));
      
      const oldMember = { ...mockMember, roles: { cache: new Map() } };
      const newMember = { ...mockMember, roles: { cache: roles } };

      await roleSyncService.handleDiscordRoleUpdate(oldMember as any, newMember as any);

      expect(mockProfileRepository.updateDiscordRoles).toHaveBeenCalledWith(
        'test-member-id',
        ['member']
      );
    });

    it('should handle role arrays with different order', async () => {
      const roles1 = new Map();
      roles1.set('role-1', createMockRole('role-a'));
      roles1.set('role-2', createMockRole('role-b'));
      
      const roles2 = new Map();
      roles2.set('role-2', createMockRole('role-b'));
      roles2.set('role-1', createMockRole('role-a'));
      
      const oldMember = { ...mockMember, roles: { cache: roles1 } };
      const newMember = { ...mockMember, roles: { cache: roles2 } };

      await roleSyncService.handleDiscordRoleUpdate(oldMember as any, newMember as any);

      expect(mockProfileRepository.updateDiscordRoles).not.toHaveBeenCalled();
    });
  });
});