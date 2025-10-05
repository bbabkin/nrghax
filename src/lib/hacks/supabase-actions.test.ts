import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHack, updateHack, deleteHack, likeHack, viewHack, updateHackPositions } from './supabase-actions';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/auth/supabase-user';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/auth/supabase-user');
vi.mock('next/cache');
vi.mock('next/navigation');
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

describe('Hack Server Actions', () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  };

  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

  const mockAdminUser = {
    id: 'admin-user-123',
    email: 'admin@example.com',
    is_admin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createHack', () => {
    const mockHackData = {
      name: 'Test Hack',
      description: 'Test Description',
      imageUrl: 'https://example.com/image.png',
      contentType: 'content' as const,
      contentBody: 'Test content body',
      difficulty: 'beginner',
      timeMinutes: 30,
    };

    it('creates a hack successfully with admin privileges', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      const mockCreatedHack = {
        id: 'new-hack-123',
        ...mockHackData,
        slug: 'test-hack-abcd1234',
        position: 5,
      };

      // Mock position query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { position: 4 } }),
      });

      // Mock hack creation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedHack, error: null }),
      });

      const result = await createHack(mockHackData);

      expect(result).toEqual(mockCreatedHack);
      expect(requireAdmin).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/admin/hacks');
    });

    it('throws error when not admin', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

      await expect(createHack(mockHackData)).rejects.toThrow('Unauthorized');
    });

    it('validates content body is required for content type', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      const invalidData = {
        ...mockHackData,
        contentBody: null,
      };

      await expect(createHack(invalidData)).rejects.toThrow('Content is required for content type');
    });

    it('validates external link is required for link type', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      const invalidData = {
        ...mockHackData,
        contentType: 'link' as const,
        contentBody: null,
        externalLink: null,
      };

      await expect(createHack(invalidData)).rejects.toThrow('External link is required for link type');
    });

    it('handles prerequisites correctly', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      const dataWithPrerequisites = {
        ...mockHackData,
        prerequisiteIds: ['hack1', 'hack2'],
      };

      const mockCreatedHack = {
        id: 'new-hack-123',
        ...mockHackData,
        slug: 'test-hack-abcd1234',
      };

      // Mock position query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { position: 4 } }),
      });

      // Mock hack creation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedHack, error: null }),
      });

      // Mock prerequisites insertion
      const mockPrerequisitesInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValueOnce({
        insert: mockPrerequisitesInsert,
      });

      await createHack(dataWithPrerequisites);

      expect(mockPrerequisitesInsert).toHaveBeenCalledWith([
        { hack_id: 'new-hack-123', prerequisite_hack_id: 'hack1' },
        { hack_id: 'new-hack-123', prerequisite_hack_id: 'hack2' },
      ]);
    });

    it('generates unique slug with random suffix', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      // Mock crypto.randomUUID
      const originalRandomUUID = global.crypto.randomUUID;
      global.crypto.randomUUID = vi.fn().mockReturnValue('abcd1234-5678-90ef-ghij-klmnopqrstuv');

      // Mock position query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      });

      // Mock hack creation
      const mockInsert = vi.fn().mockReturnThis();
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'hack-123' }, error: null }),
      });

      await createHack(mockHackData);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'test-hack-abcd1234',
        })
      );

      // Restore original function
      global.crypto.randomUUID = originalRandomUUID;
    });
  });

  describe('updateHack', () => {
    const mockUpdateData = {
      name: 'Updated Hack',
      description: 'Updated Description',
      imageUrl: 'https://example.com/updated.png',
      contentType: 'link' as const,
      externalLink: 'https://example.com',
      difficulty: 'intermediate',
      timeMinutes: 45,
    };

    it('updates hack successfully as admin', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      const mockUpdatedHack = {
        id: 'hack-123',
        ...mockUpdateData,
      };

      // Mock hack update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedHack, error: null }),
      });

      // Mock prerequisite deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const result = await updateHack('hack-123', mockUpdateData);

      expect(result).toEqual(mockUpdatedHack);
      expect(revalidatePath).toHaveBeenCalledWith('/admin/hacks');
    });

    it('handles prerequisite updates correctly', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      const dataWithPrerequisites = {
        ...mockUpdateData,
        prerequisiteIds: ['new-prereq-1', 'new-prereq-2'],
      };

      // Mock hack update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'hack-123' }, error: null }),
      });

      // Mock prerequisite deletion
      const mockDelete = vi.fn().mockReturnThis();
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValueOnce({
        delete: mockDelete,
        eq: mockDeleteEq,
      });

      // Mock prerequisite insertion
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });

      await updateHack('hack-123', dataWithPrerequisites);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('hack_id', 'hack-123');
      expect(mockInsert).toHaveBeenCalledWith([
        { hack_id: 'hack-123', prerequisite_hack_id: 'new-prereq-1' },
        { hack_id: 'hack-123', prerequisite_hack_id: 'new-prereq-2' },
      ]);
    });

    it('throws error when not admin', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

      await expect(updateHack('hack-123', mockUpdateData)).rejects.toThrow('Unauthorized');
    });
  });

  describe('deleteHack', () => {
    it('deletes hack successfully as admin', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      // Mock hack deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await deleteHack('hack-123');

      expect(revalidatePath).toHaveBeenCalledWith('/admin/hacks');
    });

    it('throws error when not admin', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

      await expect(deleteHack('hack-123')).rejects.toThrow('Unauthorized');
    });

    it('handles deletion error', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      const mockError = new Error('Deletion failed');
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      });

      await expect(deleteHack('hack-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('likeHack', () => {
    it('toggles like for authenticated user', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);

      // Mock checking existing like
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      });

      // Mock upsert
      mockSupabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      await likeHack('hack-123', true);

      expect(requireAuth).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/hacks');
    });

    it('updates existing like status', async () => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);

      // Mock existing interaction
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'interaction-123', liked: false } }),
      });

      // Mock update
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValueOnce({
        update: mockUpdate,
        eq: mockEq,
      });

      await likeHack('hack-123', true);

      expect(mockUpdate).toHaveBeenCalledWith({ liked: true });
      expect(mockEq).toHaveBeenCalledWith('id', 'interaction-123');
    });

    it('throws error when not authenticated', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('Not authenticated'));

      await expect(likeHack('hack-123', true)).rejects.toThrow('Not authenticated');
    });
  });

  describe('viewHack', () => {
    it('increments view count for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock increment_view_count function
      mockSupabase.from.mockReturnValueOnce({
        rpc: vi.fn().mockResolvedValue({ data: { view_count: 5 }, error: null }),
      });

      const result = await viewHack('hack-123');

      expect(result).toEqual({ view_count: 5 });
    });

    it('handles anonymous user with cookies', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Mock cookies
      const { cookies } = await import('next/headers');
      const mockCookies = {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      await viewHack('hack-123');

      expect(mockCookies.set).toHaveBeenCalledWith(
        'visited_hacks',
        JSON.stringify(['hack-123']),
        expect.any(Object)
      );
    });

    it('adds to existing visited hacks in cookies', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Mock cookies with existing visited hacks
      const { cookies } = await import('next/headers');
      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: JSON.stringify(['hack-456']) }),
        set: vi.fn(),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      await viewHack('hack-123');

      expect(mockCookies.set).toHaveBeenCalledWith(
        'visited_hacks',
        JSON.stringify(['hack-456', 'hack-123']),
        expect.any(Object)
      );
    });

    it('does not duplicate hack in visited list', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Mock cookies with hack already visited
      const { cookies } = await import('next/headers');
      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: JSON.stringify(['hack-123', 'hack-456']) }),
        set: vi.fn(),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      await viewHack('hack-123');

      // Should not call set since hack is already in the list
      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe('updateHackPositions', () => {
    it('updates positions for admin user', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      const hackIds = ['hack-1', 'hack-2', 'hack-3'];

      // Mock position updates
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      hackIds.forEach(() => {
        mockSupabase.from.mockReturnValueOnce({
          update: mockUpdate,
          eq: mockEq,
        });
      });

      await updateHackPositions(hackIds);

      expect(mockUpdate).toHaveBeenCalledTimes(3);
      expect(mockUpdate).toHaveBeenCalledWith({ position: 0 });
      expect(mockUpdate).toHaveBeenCalledWith({ position: 1 });
      expect(mockUpdate).toHaveBeenCalledWith({ position: 2 });
      expect(revalidatePath).toHaveBeenCalledWith('/hacks');
    });

    it('throws error when not admin', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

      await expect(updateHackPositions(['hack-1', 'hack-2'])).rejects.toThrow('Unauthorized');
    });

    it('handles update errors', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser);

      const mockError = new Error('Update failed');
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: mockError }),
      });

      await expect(updateHackPositions(['hack-1'])).rejects.toThrow('Update failed');
    });
  });
});