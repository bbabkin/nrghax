import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { markHackVisited, toggleLike } from './actions';

// Create mock Prisma client
const mockPrisma = {
  userHack: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $disconnect: vi.fn(),
};

// Mock the required modules
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  default: mockPrisma
}));

describe('Basic User Flow Tests', () => {
  const mockUserId = 'test-user-123';
  const mockHackId = 'test-hack-456';

  beforeAll(async () => {
    // Setup mocks
    const supabaseModule = await vi.importMock('@/lib/supabase/server');
    (supabaseModule.createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } }
        })
      }
    });
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('Core User Actions', () => {
    it('1. User can view a hack and it gets marked as visited', async () => {
      const prisma = mockPrisma;

      // Mock no existing interaction
      prisma.userHack.findUnique.mockResolvedValueOnce(null);

      // Mock successful creation
      prisma.userHack.create.mockResolvedValueOnce({
        id: 'interaction-1',
        userId: mockUserId,
        hackId: mockHackId,
        status: 'visited',
        completedAt: new Date()
      });

      await markHackVisited(mockHackId);

      expect(prisma.userHack.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          hackId: mockHackId,
          status: 'visited',
          completedAt: expect.any(Date)
        }
      });
    });

    it('2. User can like a hack', async () => {
      const prisma = mockPrisma;

      // Reset mocks
      prisma.userHack.findUnique.mockReset();
      prisma.userHack.create.mockReset();

      // Mock no existing interaction
      prisma.userHack.findUnique.mockResolvedValueOnce(null);

      // Mock successful like creation
      prisma.userHack.create.mockResolvedValueOnce({
        id: 'interaction-2',
        userId: mockUserId,
        hackId: mockHackId,
        status: 'liked'
      });

      await toggleLike(mockHackId);

      expect(prisma.userHack.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          hackId: mockHackId,
          status: 'liked'
        }
      });
    });

    it('3. User can unlike a hack', async () => {
      const prisma = mockPrisma;

      // Reset mocks
      prisma.userHack.findUnique.mockReset();
      prisma.userHack.delete.mockReset();

      // Mock existing liked interaction
      prisma.userHack.findUnique.mockResolvedValueOnce({
        id: 'interaction-2',
        userId: mockUserId,
        hackId: mockHackId,
        status: 'liked'
      });

      // Mock successful deletion
      prisma.userHack.delete.mockResolvedValueOnce({
        id: 'interaction-2'
      });

      await toggleLike(mockHackId);

      expect(prisma.userHack.delete).toHaveBeenCalledWith({
        where: {
          id: 'interaction-2'
        }
      });
    });

    it('4. Viewing an already visited hack does not create duplicate', async () => {
      const prisma = mockPrisma;

      // Reset mocks
      prisma.userHack.findUnique.mockReset();
      prisma.userHack.create.mockReset();
      prisma.userHack.update.mockReset();

      // Mock existing visited interaction
      prisma.userHack.findUnique.mockResolvedValueOnce({
        id: 'interaction-1',
        userId: mockUserId,
        hackId: mockHackId,
        status: 'visited',
        completedAt: new Date()
      });

      await markHackVisited(mockHackId);

      // Should not create or update
      expect(prisma.userHack.create).not.toHaveBeenCalled();
      expect(prisma.userHack.update).not.toHaveBeenCalled();
    });

    it('5. Viewing a liked hack updates it to visited', async () => {
      const prisma = mockPrisma;

      // Reset mocks
      prisma.userHack.findUnique.mockReset();
      prisma.userHack.update.mockReset();

      // Mock existing liked interaction
      prisma.userHack.findUnique.mockResolvedValueOnce({
        id: 'interaction-3',
        userId: mockUserId,
        hackId: mockHackId,
        status: 'liked',
        completedAt: null
      });

      // Mock successful update
      prisma.userHack.update.mockResolvedValueOnce({
        id: 'interaction-3',
        userId: mockUserId,
        hackId: mockHackId,
        status: 'visited',
        completedAt: new Date()
      });

      await markHackVisited(mockHackId);

      expect(prisma.userHack.update).toHaveBeenCalledWith({
        where: {
          id: 'interaction-3'
        },
        data: {
          status: 'visited',
          completedAt: expect.any(Date)
        }
      });
    });
  });

  describe('Status Value Validation', () => {
    it('Should never use "viewed" status', async () => {
      const prisma = mockPrisma;

      // Reset all mocks
      vi.clearAllMocks();

      // Re-setup auth mock
      const supabaseModule = await vi.importMock('@/lib/supabase/server');
      (supabaseModule.createClient as any).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockUserId } }
          })
        }
      });

      // Mock various scenarios
      prisma.userHack.findUnique.mockResolvedValueOnce(null);
      prisma.userHack.create.mockResolvedValueOnce({ id: 'new-1' });

      await markHackVisited(mockHackId);

      // Check that 'visited' was used, not 'viewed'
      expect(prisma.userHack.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'visited' // NOT 'viewed'
        })
      });

      // Reset for toggle like test
      prisma.userHack.findUnique.mockReset();
      prisma.userHack.create.mockReset();
      prisma.userHack.findUnique.mockResolvedValueOnce(null);
      prisma.userHack.create.mockResolvedValueOnce({ id: 'new-2' });

      await toggleLike(mockHackId);

      // Check that 'liked' was used
      expect(prisma.userHack.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'liked'
        })
      });

      // Verify no calls ever used 'viewed'
      const allCreateCalls = prisma.userHack.create.mock.calls;
      const allUpdateCalls = prisma.userHack.update.mock.calls;

      allCreateCalls.forEach(call => {
        if (call[0]?.data?.status) {
          expect(call[0].data.status).not.toBe('viewed');
        }
      });

      allUpdateCalls.forEach(call => {
        if (call[0]?.data?.status) {
          expect(call[0].data.status).not.toBe('viewed');
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('Should handle unauthenticated users gracefully', async () => {
      const supabaseModule = await vi.importMock('@/lib/supabase/server');
      const prisma = mockPrisma;

      // Reset mocks first
      prisma.userHack.findUnique.mockReset();
      prisma.userHack.create.mockReset();

      // Mock no user
      (supabaseModule.createClient as any).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null }
          })
        }
      });

      await expect(markHackVisited(mockHackId)).rejects.toThrow('Must be logged in to track visited hacks');

      // Verify no database operations were attempted
      expect(prisma.userHack.findUnique).not.toHaveBeenCalled();
      expect(prisma.userHack.create).not.toHaveBeenCalled();
    });

    it('Should handle database errors gracefully', async () => {
      const supabaseModule = await vi.importMock('@/lib/supabase/server');
      const prisma = mockPrisma;

      // Re-setup auth mock
      (supabaseModule.createClient as any).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockUserId } }
          })
        }
      });

      // Mock database error
      prisma.userHack.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await expect(markHackVisited(mockHackId)).rejects.toThrow('Failed to mark as visited: Database error');
    });
  });
});

describe('Test Coverage Summary', () => {
  it('Verifies all critical user flows are tested', () => {
    const criticalFlows = [
      'User can view hack and mark as visited',
      'User can like/unlike hacks',
      'No duplicate visited entries',
      'Status transitions work correctly',
      'Never uses "viewed" status',
      'Handles unauthenticated users',
      'Handles database errors'
    ];

    // This test just documents what we're testing
    expect(criticalFlows.length).toBe(7);

    console.log('\n=== Critical User Flows Tested ===');
    criticalFlows.forEach((flow, index) => {
      console.log(`✓ ${index + 1}. ${flow}`);
    });
  });
});