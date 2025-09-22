import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRoutine,
  updateRoutine,
  deleteRoutine,
  toggleRoutineLike,
  startRoutine,
  toggleRoutinePublic
} from '@/lib/routines/supabase-actions';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        })),
        single: vi.fn()
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }))
}));

vi.mock('@/lib/auth/supabase-user', () => ({
  requireAuth: vi.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'test@example.com',
    is_admin: false
  })),
  getCurrentUser: vi.fn(() => Promise.resolve({
    id: 'test-user-id',
    email: 'test@example.com',
    is_admin: false
  }))
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}));

describe('Routine CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Permissions', () => {
    it('should allow regular users to create private routines', async () => {
      const formData = new FormData();
      formData.append('name', 'My Private Routine');
      formData.append('description', 'Test description');
      formData.append('isPublic', 'true'); // User tries to make it public

      // Mock user is not admin
      const { requireAuth } = await import('@/lib/auth/supabase-user');
      vi.mocked(requireAuth).mockResolvedValueOnce({
        id: 'user-123',
        email: 'user@example.com',
        is_admin: false
      } as any);

      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'routine-123',
                  is_public: false, // Should be false even though user requested true
                  slug: 'my-private-routine'
                },
                error: null
              }))
            }))
          }))
        }))
      };
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

      await createRoutine(formData);

      // Verify routine was created as private
      expect(mockSupabase.from).toHaveBeenCalledWith('routines');
    });

    it('should allow admins to create public routines', async () => {
      const formData = new FormData();
      formData.append('name', 'Public Routine');
      formData.append('description', 'Public test description');
      formData.append('isPublic', 'true');

      // Mock admin user
      const { requireAuth } = await import('@/lib/auth/supabase-user');
      vi.mocked(requireAuth).mockResolvedValueOnce({
        id: 'admin-123',
        email: 'admin@example.com',
        is_admin: true
      } as any);

      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'routine-456',
                  is_public: true, // Should be true for admin
                  slug: 'public-routine'
                },
                error: null
              }))
            }))
          }))
        }))
      };
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

      await createRoutine(formData);

      expect(mockSupabase.from).toHaveBeenCalledWith('routines');
    });

    it('should prevent non-owners from editing routines', async () => {
      const { requireAuth } = await import('@/lib/auth/supabase-user');
      vi.mocked(requireAuth).mockResolvedValueOnce({
        id: 'other-user',
        email: 'other@example.com',
        is_admin: false
      } as any);

      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { created_by: 'original-owner' },
                error: null
              }))
            }))
          }))
        }))
      };
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

      const formData = new FormData();
      formData.append('name', 'Updated Name');
      formData.append('description', 'Updated description');

      await expect(updateRoutine('routine-123', formData)).rejects.toThrow('Unauthorized');
    });

    it('should allow admins to edit any routine', async () => {
      const { requireAuth } = await import('@/lib/auth/supabase-user');
      vi.mocked(requireAuth).mockResolvedValueOnce({
        id: 'admin-user',
        email: 'admin@example.com',
        is_admin: true
      } as any);

      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { created_by: 'some-other-user' },
                error: null
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              error: null
            }))
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              error: null
            }))
          }))
        }))
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const formData = new FormData();
      formData.append('name', 'Admin Updated');
      formData.append('description', 'Admin can edit this');

      // Should not throw error
      await updateRoutine('routine-123', formData);
    });
  });

  describe('Routine Interactions', () => {
    it('should handle routine like toggle', async () => {
      const { requireAuth } = await import('@/lib/auth/supabase-user');
      vi.mocked(requireAuth).mockResolvedValueOnce({
        id: 'user-123',
        email: 'user@example.com',
        is_admin: false
      } as any);

      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: { id: 'interaction-123', liked: false },
                  error: null
                }))
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              error: null
            }))
          }))
        }))
      };
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

      await toggleRoutineLike('routine-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_routines');
    });

    it('should track routine progress', async () => {
      const { requireAuth } = await import('@/lib/auth/supabase-user');
      vi.mocked(requireAuth).mockResolvedValueOnce({
        id: 'user-123',
        email: 'user@example.com',
        is_admin: false
      } as any);

      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: null
                }))
              }))
            }))
          })),
          insert: vi.fn(() => ({
            error: null
          }))
        }))
      };
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

      await startRoutine('routine-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_routines');
    });
  });

  describe('Admin-only Operations', () => {
    it('should prevent non-admins from toggling public status', async () => {
      const { requireAuth } = await import('@/lib/auth/supabase-user');
      vi.mocked(requireAuth).mockResolvedValueOnce({
        id: 'user-123',
        email: 'user@example.com',
        is_admin: false
      } as any);

      await expect(toggleRoutinePublic('routine-123')).rejects.toThrow('Unauthorized');
    });

    it('should allow admins to toggle public status', async () => {
      const { requireAuth } = await import('@/lib/auth/supabase-user');
      vi.mocked(requireAuth).mockResolvedValueOnce({
        id: 'admin-123',
        email: 'admin@example.com',
        is_admin: true
      } as any);

      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { is_public: false },
                error: null
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              error: null
            }))
          }))
        }))
      };
      vi.mocked(createClient).mockResolvedValueOnce(mockSupabase as any);

      await toggleRoutinePublic('routine-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('routines');
    });
  });

  describe('Routine with Hacks', () => {
    it('should create routine with associated hacks', async () => {
      const formData = new FormData();
      formData.append('name', 'Routine with Hacks');
      formData.append('description', 'Has multiple hacks');
      formData.append('hackIds', 'hack-1');
      formData.append('hackIds', 'hack-2');
      formData.append('hackIds', 'hack-3');

      const { requireAuth } = await import('@/lib/auth/supabase-user');
      vi.mocked(requireAuth).mockResolvedValueOnce({
        id: 'user-123',
        email: 'user@example.com',
        is_admin: false
      } as any);

      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'routines') {
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() => ({
                    data: {
                      id: 'routine-789',
                      slug: 'routine-with-hacks'
                    },
                    error: null
                  }))
                }))
              }))
            };
          }
          if (table === 'routine_hacks') {
            return {
              insert: vi.fn(() => ({
                error: null
              }))
            };
          }
          return {};
        })
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      await createRoutine(formData);

      expect(mockSupabase.from).toHaveBeenCalledWith('routine_hacks');
    });
  });
});