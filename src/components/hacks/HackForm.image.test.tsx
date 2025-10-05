import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HackForm } from './HackForm';
import { createHackWithImage, updateHackWithImage } from '@/lib/hacks/client-actions';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/hacks/client-actions', () => ({
  createHackWithImage: vi.fn(),
  updateHackWithImage: vi.fn(),
}));

// Mock fetch for tags
global.fetch = vi.fn();

describe('HackForm - Image Persistence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);
  });

  describe('Image field data format handling', () => {
    it('should display image with camelCase data (imageUrl, imagePath)', () => {
      const camelCaseHack = {
        id: 'hack-123',
        name: 'Test Hack',
        description: 'Test Description',
        imageUrl: 'https://example.com/camel-image.jpg',
        imagePath: 'uploads/camel-image.jpg',
        contentType: 'content' as const,
        contentBody: 'Test content',
      };

      render(
        <HackForm
          hack={camelCaseHack}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Check that image preview is displayed
      const images = screen.getAllByAltText('Preview');
      expect(images.length).toBeGreaterThan(0);
      const imageElement = images[0] as HTMLImageElement;
      // Next.js Image transforms URLs, so check if the original URL is in the src
      expect(imageElement.src).toContain(encodeURIComponent('https://example.com/camel-image.jpg'));
    });

    it('should display image with snake_case data (image_url, image_path)', () => {
      const snakeCaseHack = {
        id: 'hack-123',
        name: 'Test Hack',
        description: 'Test Description',
        image_url: 'https://example.com/snake-image.jpg',
        image_path: 'uploads/snake-image.jpg',
        content_type: 'content' as const,
        content_body: 'Test content',
      };

      render(
        <HackForm
          hack={snakeCaseHack}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Check that image preview is displayed
      const images = screen.getAllByAltText('Preview');
      expect(images.length).toBeGreaterThan(0);
      const imageElement = images[0] as HTMLImageElement;
      // Next.js Image transforms URLs, so check if the original URL is in the src
      expect(imageElement.src).toContain(encodeURIComponent('https://example.com/snake-image.jpg'));
    });

    it('should prioritize camelCase over snake_case when both are present', () => {
      const mixedHack = {
        id: 'hack-123',
        name: 'Test Hack',
        description: 'Test Description',
        imageUrl: 'https://example.com/camel-priority.jpg',
        image_url: 'https://example.com/snake-fallback.jpg',
        imagePath: 'uploads/camel-priority.jpg',
        image_path: 'uploads/snake-fallback.jpg',
        contentType: 'content' as const,
        contentBody: 'Test content',
      };

      render(
        <HackForm
          hack={mixedHack}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Should use camelCase version
      const images = screen.getAllByAltText('Preview');
      expect(images.length).toBeGreaterThan(0);
      const imageElement = images[0] as HTMLImageElement;
      // Next.js Image transforms URLs, so check if the original URL is in the src
      expect(imageElement.src).toContain(encodeURIComponent('https://example.com/camel-priority.jpg'));
    });

    it('should handle missing image gracefully', () => {
      const hackWithoutImage = {
        id: 'hack-123',
        name: 'Test Hack',
        description: 'Test Description',
        contentType: 'content' as const,
        contentBody: 'Test content',
      };

      render(
        <HackForm
          hack={hackWithoutImage}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Should not show preview image
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();

      // Should show file input
      const fileInput = screen.getByLabelText(/Image/);
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Image persistence during updates', () => {
    it('should preserve existing imageUrl when updating without new image', async () => {
      const existingHack = {
        id: 'hack-123',
        name: 'Existing Hack',
        description: 'Existing description',
        imageUrl: 'https://example.com/existing.jpg',
        contentType: 'content' as const,
        contentBody: 'Existing content',
      };

      vi.mocked(updateHackWithImage).mockResolvedValue({ id: 'hack-123' });

      const { container } = render(
        <HackForm
          hack={existingHack}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Submit form without changing image
      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(updateHackWithImage).toHaveBeenCalledWith(
          'hack-123',
          expect.objectContaining({
            existingImageUrl: 'https://example.com/existing.jpg',
            existingImagePath: undefined,
            imageFile: null,
          }),
          'user-123'
        );
      });
    });

    it('should preserve existing imagePath when updating without new image', async () => {
      const existingHack = {
        id: 'hack-123',
        name: 'Existing Hack',
        description: 'Existing description',
        imagePath: 'uploads/existing.jpg',
        imageUrl: 'https://storage.example.com/uploads/existing.jpg',
        contentType: 'content' as const,
        contentBody: 'Existing content',
      };

      vi.mocked(updateHackWithImage).mockResolvedValue({ id: 'hack-123' });

      const { container } = render(
        <HackForm
          hack={existingHack}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Submit form without changing image
      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(updateHackWithImage).toHaveBeenCalledWith(
          'hack-123',
          expect.objectContaining({
            existingImageUrl: 'https://storage.example.com/uploads/existing.jpg',
            existingImagePath: 'uploads/existing.jpg',
            imageFile: null,
          }),
          'user-123'
        );
      });
    });

    it('should handle both snake_case and camelCase in update', async () => {
      const mixedFormatHack = {
        id: 'hack-123',
        name: 'Mixed Format Hack',
        description: 'Mixed format description',
        image_path: 'uploads/snake.jpg',
        image_url: 'https://storage.example.com/uploads/snake.jpg',
        content_type: 'content' as const,
        content_body: 'Mixed content',
      };

      vi.mocked(updateHackWithImage).mockResolvedValue({ id: 'hack-123' });

      const { container } = render(
        <HackForm
          hack={mixedFormatHack}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Submit form
      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(updateHackWithImage).toHaveBeenCalledWith(
          'hack-123',
          expect.objectContaining({
            existingImageUrl: 'https://storage.example.com/uploads/snake.jpg',
            existingImagePath: 'uploads/snake.jpg',
            imageFile: null,
          }),
          'user-123'
        );
      });
    });
  });

  describe('Image validation', () => {
    it('should require image for new hacks regardless of data format', async () => {
      const { container } = render(
        <HackForm
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Fill in required fields except image
      fireEvent.change(screen.getByLabelText(/Name/), {
        target: { value: 'New Hack' },
      });
      fireEvent.change(screen.getByLabelText(/Description/), {
        target: { value: 'New Description' },
      });

      // Submit form
      const form = container.querySelector('form');
      fireEvent.submit(form!);

      // Should show error about missing image
      await waitFor(() => {
        expect(screen.getByText(/Please select an image/i)).toBeInTheDocument();
      });

      // Should not call create function
      expect(createHackWithImage).not.toHaveBeenCalled();
    });

    it('should not require new image for existing hacks with imageUrl', async () => {
      const existingHack = {
        id: 'hack-123',
        name: 'Existing Hack',
        description: 'Existing description',
        imageUrl: 'https://example.com/existing.jpg',
        contentType: 'content' as const,
        contentBody: 'Existing content',
      };

      vi.mocked(updateHackWithImage).mockResolvedValue({ id: 'hack-123' });

      const { container } = render(
        <HackForm
          hack={existingHack}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Submit form without new image
      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        // Should call update without error
        expect(updateHackWithImage).toHaveBeenCalled();
      });

      // Should not show error
      expect(screen.queryByText(/Please select an image/i)).not.toBeInTheDocument();
    });

    it('should not require new image for existing hacks with image_url', async () => {
      const existingHack = {
        id: 'hack-123',
        name: 'Existing Hack',
        description: 'Existing description',
        image_url: 'https://example.com/existing-snake.jpg',
        content_type: 'content' as const,
        content_body: 'Existing content',
      };

      vi.mocked(updateHackWithImage).mockResolvedValue({ id: 'hack-123' });

      const { container } = render(
        <HackForm
          hack={existingHack}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Submit form without new image
      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        // Should call update without error
        expect(updateHackWithImage).toHaveBeenCalled();
      });

      // Should not show error
      expect(screen.queryByText(/Please select an image/i)).not.toBeInTheDocument();
    });
  });

  describe('Real-world scenario tests', () => {
    it('should handle API response format from getHackWithPrerequisites', async () => {
      // This mimics the exact format returned by getHackWithPrerequisites
      const apiFormatHack = {
        id: 'hack-123',
        name: 'API Hack',
        slug: 'api-hack',
        description: 'API Description',
        imageUrl: 'https://storage.supabase.co/public/images/hack.jpg',
        imagePath: 'images/hack.jpg',
        contentType: 'content' as const,
        contentBody: '<p>API Content</p>',
        externalLink: null,
        mediaType: 'video',
        mediaUrl: 'https://youtube.com/watch?v=123',
        mediaThumbnailUrl: 'https://img.youtube.com/vi/123/0.jpg',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        prerequisiteIds: ['prereq-1', 'prereq-2'],
      };

      render(
        <HackForm
          hack={apiFormatHack}
          availableHacks={[]}
          userId="user-123"
        />
      );

      // Verify image is displayed
      const images = screen.getAllByAltText('Preview');
      expect(images.length).toBeGreaterThan(0);
      const imageElement = images[0] as HTMLImageElement;
      expect(imageElement.src).toContain(encodeURIComponent('https://storage.supabase.co/public/images/hack.jpg'));

      // Verify content is populated
      expect(screen.getByDisplayValue('API Hack')).toBeInTheDocument();
      expect(screen.getByDisplayValue('API Description')).toBeInTheDocument();
    });

    it('should handle edit page data flow correctly', async () => {
      // Simulate the data flow:
      // 1. Edit page fetches hack with getHackWithPrerequisites
      // 2. Data is passed to HackForm
      // 3. User submits without changing image
      // 4. Image should persist

      const fetchedHack = {
        id: 'hack-456',
        name: 'Fetched Hack',
        description: 'Fetched Description',
        imageUrl: 'https://storage.supabase.co/public/images/original.jpg',
        imagePath: 'images/original.jpg',
        contentType: 'content' as const,
        contentBody: 'Original content',
        prerequisiteIds: [],
      };

      vi.mocked(updateHackWithImage).mockResolvedValue({ id: 'hack-456' });

      const { container } = render(
        <HackForm
          hack={fetchedHack}
          availableHacks={[]}
          userId="admin-user"
        />
      );

      // Verify image is displayed initially
      const images = screen.getAllByAltText('Preview');
      expect(images.length).toBeGreaterThan(0);

      // Change only the name
      const nameInput = screen.getByDisplayValue('Fetched Hack');
      fireEvent.change(nameInput, { target: { value: 'Updated Hack Name' } });

      // Submit form
      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        // Verify image data is preserved in the update call
        expect(updateHackWithImage).toHaveBeenCalledWith(
          'hack-456',
          expect.objectContaining({
            name: 'Updated Hack Name',
            description: 'Fetched Description',
            existingImageUrl: 'https://storage.supabase.co/public/images/original.jpg',
            existingImagePath: 'images/original.jpg',
            imageFile: null, // No new image uploaded
          }),
          'admin-user'
        );
      });
    });
  });
});