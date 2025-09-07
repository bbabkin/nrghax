import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HackRepository } from '../../../src/database/repositories/hackRepository';
import { 
  mockSupabaseClient, 
  createMockHack, 
  mockSuccessResponse, 
  mockErrorResponse 
} from '../../mocks/supabase';

vi.mock('../../../src/database/supabase', () => ({
  supabase: mockSupabaseClient,
}));

describe('HackRepository', () => {
  let hackRepository: HackRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    hackRepository = new HackRepository();
    
    // Reset mock implementations
    mockSupabaseClient.from = vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSuccessResponse(null)),
      then: vi.fn((callback) => callback(mockSuccessResponse([]))),
    }));
  });

  describe('getAllHacks', () => {
    it('should fetch all hacks with cache', async () => {
      const mockHacks = [
        createMockHack({ id: 'hack-1' }),
        createMockHack({ id: 'hack-2' }),
      ];
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse(mockHacks)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getAllHacks();

      expect(result).toEqual(mockHacks);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('hacks');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });

      // Test cache
      const cachedResult = await hackRepository.getAllHacks();
      expect(cachedResult).toEqual(mockHacks);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1); // Should use cache
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockErrorResponse('Database error')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getAllHacks();

      expect(result).toEqual([]);
    });

    it('should handle null data', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getAllHacks();

      expect(result).toEqual([]);
    });

    it('should refresh cache after TTL', async () => {
      vi.useFakeTimers();
      
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

      const result1 = await hackRepository.getAllHacks();
      expect(result1).toEqual(mockHacks1);

      // Advance time past cache TTL (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);

      const result2 = await hackRepository.getAllHacks();
      expect(result2).toEqual(mockHacks2);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('getHackById', () => {
    it('should fetch hack by ID', async () => {
      const mockHack = createMockHack({ id: 'hack-1' });
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockSuccessResponse(mockHack)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getHackById('hack-1');

      expect(result).toEqual(mockHack);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'hack-1');
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should return null for non-existent hack', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockErrorResponse('Not found')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getHackById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Connection error')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getHackById('hack-1');

      expect(result).toBeNull();
    });
  });

  describe('searchHacks', () => {
    it('should search hacks by query', async () => {
      const mockHacks = [
        createMockHack({ name: 'Morning Meditation' }),
        createMockHack({ description: 'Meditation practice' }),
      ];
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue(mockSuccessResponse(mockHacks)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.searchHacks('meditation');

      expect(result).toEqual(mockHacks);
      expect(mockQuery.or).toHaveBeenCalledWith(
        `name.ilike.%meditation%,description.ilike.%meditation%`
      );
    });

    it('should handle empty search results', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue(mockSuccessResponse([])),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.searchHacks('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle special characters in search', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue(mockSuccessResponse([])),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.searchHacks('test%_special');

      expect(result).toEqual([]);
      expect(mockQuery.or).toHaveBeenCalledWith(
        `name.ilike.%test%_special%,description.ilike.%test%_special%`
      );
    });

    it('should handle search errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockRejectedValue(new Error('Search failed')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.searchHacks('test');

      expect(result).toEqual([]);
    });
  });

  describe('getHacksByCategory', () => {
    it('should fetch hacks by category', async () => {
      const mockHacks = [
        createMockHack({ category: 'morning' }),
        createMockHack({ category: 'morning' }),
      ];
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse(mockHacks)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getHacksByCategory('morning');

      expect(result).toEqual(mockHacks);
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'morning');
      expect(mockQuery.order).toHaveBeenCalledWith('energy_impact', { ascending: false });
    });

    it('should handle empty category results', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse([])),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getHacksByCategory('sleep');

      expect(result).toEqual([]);
    });

    it('should handle category fetch errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockErrorResponse('Query failed')),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getHacksByCategory('exercise');

      expect(result).toEqual([]);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache on error', async () => {
      // First call succeeds and caches
      const mockHacks = [createMockHack()];
      const mockQuery1 = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse(mockHacks)),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockQuery1);

      const result1 = await hackRepository.getAllHacks();
      expect(result1).toEqual(mockHacks);

      // Second call fails
      const mockQuery2 = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockErrorResponse('Error')),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mockQuery2);

      // Force cache invalidation by advancing time
      vi.useFakeTimers();
      vi.advanceTimersByTime(6 * 60 * 1000);
      
      const result2 = await hackRepository.getAllHacks();
      expect(result2).toEqual([]);

      vi.useRealTimers();
    });

    it('should handle concurrent requests with cache', async () => {
      const mockHacks = [createMockHack()];
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse(mockHacks)),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Make concurrent requests
      const [result1, result2, result3] = await Promise.all([
        hackRepository.getAllHacks(),
        hackRepository.getAllHacks(),
        hackRepository.getAllHacks(),
      ]);

      expect(result1).toEqual(mockHacks);
      expect(result2).toEqual(mockHacks);
      expect(result3).toEqual(mockHacks);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1); // Should only fetch once
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue(mockSuccessResponse([])),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.searchHacks(longQuery);

      expect(result).toEqual([]);
    });

    it('should handle null category', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse([])),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getHacksByCategory(null as any);

      expect(result).toEqual([]);
    });

    it('should handle undefined search query', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue(mockSuccessResponse([])),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.searchHacks(undefined as any);

      expect(result).toEqual([]);
    });

    it('should handle malformed hack data', async () => {
      const malformedData = { id: 'hack-1' }; // Missing required fields
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockSuccessResponse([malformedData])),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await hackRepository.getAllHacks();

      expect(result).toEqual([malformedData]);
    });
  });
});