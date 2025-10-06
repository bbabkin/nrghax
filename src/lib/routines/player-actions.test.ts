import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateRoutinePosition,
  markHackComplete,
  saveRoutineProgress,
  getRoutinePlayState,
} from './player-actions';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Player Actions', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      upsert: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase);
  });

  describe('updateRoutinePosition', () => {
    it('should update the current position in user_routines table', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'ur-1',
          current_hack_position: 2,
          last_played_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await updateRoutinePosition('routine-123', 2);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_routines');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        current_hack_position: 2,
        last_played_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith('routine_id', 'routine-123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result.success).toBe(true);
    });

    it('should create user_routines entry if it does not exist', async () => {
      // First attempt to update returns no rows
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      // Then insert succeeds
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'ur-new',
          current_hack_position: 1,
        },
        error: null,
      });

      const result = await updateRoutinePosition('routine-123', 1);

      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await updateRoutinePosition('routine-123', 2);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should update progress percentage based on position', async () => {
      const totalHacks = 10;
      const currentPosition = 5;
      const expectedProgress = Math.floor((currentPosition / totalHacks) * 100);

      mockSupabase.single.mockResolvedValue({
        data: {
          progress: expectedProgress,
        },
        error: null,
      });

      await updateRoutinePosition('routine-123', currentPosition, totalHacks);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          progress: expectedProgress,
        })
      );
    });
  });

  describe('markHackComplete', () => {
    it('should mark a hack as completed for the user', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          viewed: true,
          completed_at: expect.any(String),
        },
        error: null,
      });

      const result = await markHackComplete('hack-123', 'routine-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_hacks');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          hack_id: 'hack-123',
          viewed: true,
          viewed_at: expect.any(String),
        })
      );
    });

    it('should track routine context when provided', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {},
        error: null,
      });

      await markHackComplete('hack-123', 'routine-123');

      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          routine_id: 'routine-123',
        })
      );
    });
  });

  describe('saveRoutineProgress', () => {
    it('should save current position and calculate progress', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          current_hack_position: 3,
          progress: 30,
        },
        error: null,
      });

      const result = await saveRoutineProgress({
        routineId: 'routine-123',
        currentPosition: 3,
        totalHacks: 10,
        completedHacks: ['hack-1', 'hack-2', 'hack-3'],
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_hack_position: 3,
          progress: 30,
          last_played_at: expect.any(String),
        })
      );
    });

    it('should mark routine as completed when all hacks are finished', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          completed: true,
          completed_at: expect.any(String),
          progress: 100,
        },
        error: null,
      });

      const result = await saveRoutineProgress({
        routineId: 'routine-123',
        currentPosition: 10,
        totalHacks: 10,
        completedHacks: new Array(10).fill(0).map((_, i) => `hack-${i}`),
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: true,
          completed_at: expect.any(String),
          progress: 100,
        })
      );
    });

    it('should not mark as completed if hacks remain', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          completed: false,
          progress: 50,
        },
        error: null,
      });

      await saveRoutineProgress({
        routineId: 'routine-123',
        currentPosition: 5,
        totalHacks: 10,
        completedHacks: ['hack-1', 'hack-2', 'hack-3', 'hack-4', 'hack-5'],
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: false,
          progress: 50,
        })
      );
    });
  });

  describe('getRoutinePlayState', () => {
    it('should retrieve current play state for a routine', async () => {
      const mockPlayState = {
        routine_id: 'routine-123',
        user_id: 'user-123',
        current_hack_position: 5,
        progress: 50,
        last_played_at: '2024-01-15T10:00:00Z',
        completed: false,
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPlayState,
        error: null,
      });

      const result = await getRoutinePlayState('routine-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('user_routines');
      expect(mockSupabase.eq).toHaveBeenCalledWith('routine_id', 'routine-123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result.data).toEqual(mockPlayState);
    });

    it('should return initial state if no record exists', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await getRoutinePlayState('routine-123');

      expect(result.data).toEqual({
        current_hack_position: 0,
        progress: 0,
        completed: false,
      });
    });

    it('should include completed hacks in the response', async () => {
      mockSupabase.eq.mockReturnValueOnce({
        ...mockSupabase,
        single: vi.fn().mockResolvedValue({
          data: {
            current_hack_position: 3,
          },
          error: null,
        }),
      });

      // Mock query for completed hacks
      mockSupabase.select.mockReturnValueOnce({
        ...mockSupabase,
        eq: vi.fn().mockReturnValue({
          ...mockSupabase,
          eq: vi.fn().mockResolvedValue({
            data: [
              { hack_id: 'hack-1', viewed: true },
              { hack_id: 'hack-2', viewed: true },
            ],
            error: null,
          }),
        }),
      });

      const result = await getRoutinePlayState('routine-123');

      expect(result.data?.completedHacks).toHaveLength(2);
    });
  });

  describe('Auto-advance logic', () => {
    it('should determine if auto-advance should occur', () => {
      const shouldAutoAdvance = (
        mediaType: string | null,
        autoplayEnabled: boolean,
        isLastHack: boolean
      ): boolean => {
        if (isLastHack) return false;
        if (!autoplayEnabled) return false;
        if (mediaType === 'youtube' || mediaType === 'video') return true;
        return false;
      };

      // Should auto-advance for videos with autoplay enabled
      expect(shouldAutoAdvance('youtube', true, false)).toBe(true);
      expect(shouldAutoAdvance('video', true, false)).toBe(true);

      // Should not auto-advance for text content
      expect(shouldAutoAdvance(null, true, false)).toBe(false);

      // Should not auto-advance if autoplay disabled
      expect(shouldAutoAdvance('youtube', false, false)).toBe(false);

      // Should not auto-advance on last hack
      expect(shouldAutoAdvance('youtube', true, true)).toBe(false);
    });

    it('should handle transition delay for smooth UX', async () => {
      const transitionDelay = 500; // ms

      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, transitionDelay));
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(transitionDelay);
    });
  });

  describe('Error recovery', () => {
    it('should retry failed position updates', async () => {
      // First attempt fails
      mockSupabase.single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Network error' },
        })
        // Second attempt succeeds
        .mockResolvedValueOnce({
          data: { current_hack_position: 2 },
          error: null,
        });

      const result = await updateRoutinePosition('routine-123', 2, undefined, {
        retries: 1,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledTimes(2);
    });

    it('should handle offline scenario gracefully', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Network request failed'));

      const result = await updateRoutinePosition('routine-123', 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network request failed');
    });
  });
});
