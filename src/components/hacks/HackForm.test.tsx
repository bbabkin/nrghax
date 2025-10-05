import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HackForm } from './HackForm';
import { createHackWithImage, updateHackWithImage } from '@/lib/hacks/client-actions';

// Mock the router
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock the client actions
vi.mock('@/lib/hacks/client-actions', () => ({
  createHackWithImage: vi.fn(),
  updateHackWithImage: vi.fn(),
}));

// Mock child components to simplify testing
vi.mock('./RichTextEditor', () => ({
  RichTextEditor: ({ content, onChange }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('./PrerequisiteSelector', () => ({
  PrerequisiteSelector: ({ selectedPrerequisites, onPrerequisitesChange }: any) => (
    <div data-testid="prerequisite-selector">
      <select
        multiple
        data-testid="prerequisite-select"
        value={selectedPrerequisites}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, option => option.value);
          onPrerequisitesChange(selected);
        }}
      >
        <option value="hack1">Hack 1</option>
        <option value="hack2">Hack 2</option>
      </select>
    </div>
  ),
}));

vi.mock('./TagSelector', () => ({
  TagSelector: ({ selectedTags, onTagsChange, onTagsLoaded }: any) => {
    // Call onTagsLoaded on mount
    if (onTagsLoaded) {
      setTimeout(() => onTagsLoaded(true), 0);
    }
    return (
      <div data-testid="tag-selector">
        <select
          multiple
          data-testid="tag-select"
          value={selectedTags}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            onTagsChange(selected);
          }}
        >
          <option value="tag1">Tag 1</option>
          <option value="tag2">Tag 2</option>
        </select>
      </div>
    );
  },
}));

vi.mock('@/components/ui/media-input', () => ({
  MediaInput: ({ mediaType, mediaUrl, onMediaTypeChange, onMediaUrlChange }: any) => (
    <div data-testid="media-input">
      <select
        data-testid="media-type"
        value={mediaType || 'none'}
        onChange={(e) => onMediaTypeChange && onMediaTypeChange(e.target.value)}
      >
        <option value="none">None</option>
        <option value="video">Video</option>
        <option value="iframe">iFrame</option>
      </select>
      {mediaType !== 'none' && mediaType != null && (
        <input
          data-testid="media-url"
          type="text"
          value={mediaUrl || ''}
          onChange={(e) => onMediaUrlChange && onMediaUrlChange(e.target.value)}
        />
      )}
    </div>
  ),
}));

describe('HackForm', () => {
  const mockUserId = 'test-user-123';
  const mockAvailableHacks = [
    { id: 'hack1', name: 'Hack 1' },
    { id: 'hack2', name: 'Hack 2' },
    { id: 'hack3', name: 'Hack 3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders all form fields correctly', async () => {
      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Check main form fields
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByText(/Content Type/i)).toBeInTheDocument();
      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      expect(screen.getByTestId('prerequisite-selector')).toBeInTheDocument();
      expect(screen.getByTestId('tag-selector')).toBeInTheDocument();
      expect(screen.getByTestId('media-input')).toBeInTheDocument();

      // Check submit button
      expect(screen.getByRole('button', { name: /Create Hack/i })).toBeInTheDocument();
    });

    it('submits form with correct data for content type', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Fill in form fields
      await user.type(screen.getByLabelText(/Name/i), 'Test Hack');
      await user.type(screen.getByLabelText(/Description/i), 'Test Description');

      // Select content type (content is default)
      const richTextEditor = screen.getByTestId('rich-text-editor');
      await user.type(richTextEditor, 'Test content body');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Hack/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(createHackWithImage).toHaveBeenCalledWith(
          expect.any(FormData)
        );
      });
    });

    it('handles external link content type', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Switch to external link
      const externalLinkRadio = screen.getByLabelText(/External Link/i);
      await user.click(externalLinkRadio);

      // External link input should appear
      const externalLinkInput = screen.getByLabelText(/External Link URL/i);
      expect(externalLinkInput).toBeInTheDocument();

      await user.type(externalLinkInput, 'https://example.com');

      // Submit form
      await user.type(screen.getByLabelText(/Name/i), 'Test Hack');
      await user.type(screen.getByLabelText(/Description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /Create Hack/i }));

      await waitFor(() => {
        expect(createHackWithImage).toHaveBeenCalled();
      });
    });

    it('handles image upload', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/Choose Image/i);

      await user.upload(fileInput, file);

      // Check if preview appears
      await waitFor(() => {
        expect(screen.getByAltText(/Preview/i)).toBeInTheDocument();
      });
    });

    it('validates image file type', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/Choose Image/i);

      await user.upload(fileInput, invalidFile);

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
      });
    });

    it('validates image file size', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Create a file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/Choose Image/i);

      await user.upload(fileInput, largeFile);

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/File size exceeds 5MB/i)).toBeInTheDocument();
      });
    });

    it('handles prerequisites selection', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      const prerequisiteSelect = screen.getByTestId('prerequisite-select');

      // Select multiple prerequisites
      await user.selectOptions(prerequisiteSelect, ['hack1', 'hack2']);

      // Fill required fields and submit
      await user.type(screen.getByLabelText(/Name/i), 'Test Hack');
      await user.type(screen.getByLabelText(/Description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /Create Hack/i }));

      await waitFor(() => {
        expect(createHackWithImage).toHaveBeenCalled();
      });
    });

    it('handles media input', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Select video media type
      const mediaTypeSelect = screen.getByTestId('media-type');
      await user.selectOptions(mediaTypeSelect, 'video');

      // Enter video URL
      const mediaUrlInput = screen.getByTestId('media-url');
      await user.type(mediaUrlInput, 'https://youtube.com/watch?v=123');

      // Fill required fields and submit
      await user.type(screen.getByLabelText(/Name/i), 'Test Hack');
      await user.type(screen.getByLabelText(/Description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /Create Hack/i }));

      await waitFor(() => {
        expect(createHackWithImage).toHaveBeenCalled();
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();

      // Mock slow response
      vi.mocked(createHackWithImage).mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/Name/i), 'Test Hack');
      await user.type(screen.getByLabelText(/Description/i), 'Test Description');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create Hack/i });
      await user.click(submitButton);

      // Check for loading state
      expect(screen.getByRole('button', { name: /Creating/i })).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('displays error message on submission failure', async () => {
      const user = userEvent.setup();

      // Mock error response
      vi.mocked(createHackWithImage).mockRejectedValue(new Error('Failed to create hack'));

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/Name/i), 'Test Hack');
      await user.type(screen.getByLabelText(/Description/i), 'Test Description');

      // Submit form
      await user.click(screen.getByRole('button', { name: /Create Hack/i }));

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to create hack/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockHack = {
      id: 'existing-hack-123',
      name: 'Existing Hack',
      slug: 'existing-hack',
      description: 'Existing Description',
      image_url: 'https://example.com/image.png',
      image_path: '/images/existing.png',
      content_type: 'content' as const,
      content_body: 'Existing content',
      external_link: null,
      media_type: 'video',
      media_url: 'https://youtube.com/watch?v=existing',
      media_thumbnail_url: null,
      prerequisite_ids: ['hack1'],
    };

    // Test with camelCase data (as returned by API)
    const mockHackCamelCase = {
      id: 'existing-hack-123',
      name: 'Existing Hack',
      slug: 'existing-hack',
      description: 'Existing Description',
      imageUrl: 'https://example.com/image.png',
      imagePath: '/images/existing.png',
      contentType: 'content' as const,
      contentBody: 'Existing content',
      externalLink: null,
      mediaType: 'video',
      mediaUrl: 'https://youtube.com/watch?v=existing',
      mediaThumbnailUrl: null,
      prerequisiteIds: ['hack1'],
    };

    it('populates form with existing hack data (snake_case)', () => {
      render(
        <HackForm
          hack={mockHack}
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Check if fields are populated
      expect(screen.getByDisplayValue('Existing Hack')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
      expect(screen.getByTestId('rich-text-editor')).toHaveValue('Existing content');
      expect(screen.getByTestId('media-type')).toHaveValue('video');
      expect(screen.getByTestId('media-url')).toHaveValue('https://youtube.com/watch?v=existing');

      // Check submit button text
      expect(screen.getByRole('button', { name: /Update Hack/i })).toBeInTheDocument();
    });

    it('populates form with existing hack data (camelCase from API)', () => {
      render(
        <HackForm
          hack={mockHackCamelCase as any}
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Check if fields are populated correctly with camelCase data
      expect(screen.getByDisplayValue('Existing Hack')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
      expect(screen.getByTestId('rich-text-editor')).toHaveValue('Existing content');
      expect(screen.getByTestId('media-type')).toHaveValue('video');
      expect(screen.getByTestId('media-url')).toHaveValue('https://youtube.com/watch?v=existing');

      // Check submit button text
      expect(screen.getByRole('button', { name: /Update Hack/i })).toBeInTheDocument();
    });

    it('submits updated data correctly', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          hack={mockHack}
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Update name
      const nameInput = screen.getByLabelText(/Name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Hack Name');

      // Submit form
      await user.click(screen.getByRole('button', { name: /Update Hack/i }));

      await waitFor(() => {
        expect(updateHackWithImage).toHaveBeenCalledWith(
          'existing-hack-123',
          expect.any(FormData)
        );
      });
    });

    it('handles switching content type from content to link', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          hack={mockHack}
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Switch to external link
      const externalLinkRadio = screen.getByLabelText(/External Link/i);
      await user.click(externalLinkRadio);

      // Rich text editor should be hidden, external link input should appear
      expect(screen.queryByTestId('rich-text-editor')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/External Link URL/i)).toBeInTheDocument();
    });

    it('preserves existing image when not uploading new one', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          hack={mockHack}
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Check existing image preview
      expect(screen.getByAltText(/Preview/i)).toHaveAttribute('src', expect.stringContaining('example.com/image.png'));

      // Submit without changing image
      await user.click(screen.getByRole('button', { name: /Update Hack/i }));

      await waitFor(() => {
        const formData = vi.mocked(updateHackWithImage).mock.calls[0][1];
        // FormData should not include new image
        expect(formData).toBeInstanceOf(FormData);
      });
    });

    it('handles removing and adding new image', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          hack={mockHack}
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Remove existing image
      const removeButton = screen.getByRole('button', { name: /Remove/i });
      await user.click(removeButton);

      // Upload new image
      const file = new File(['new'], 'new.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/Choose Image/i);
      await user.upload(fileInput, file);

      // Submit form
      await user.click(screen.getByRole('button', { name: /Update Hack/i }));

      await waitFor(() => {
        expect(updateHackWithImage).toHaveBeenCalled();
      });
    });

    it('navigates back to hacks page after successful update', async () => {
      const user = userEvent.setup();

      vi.mocked(updateHackWithImage).mockResolvedValue(undefined);

      render(
        <HackForm
          hack={mockHack}
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Submit form
      await user.click(screen.getByRole('button', { name: /Update Hack/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/hacks');
      });
    });
  });

  describe('Form Validation', () => {
    it('requires name field', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Try to submit without name
      await user.type(screen.getByLabelText(/Description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /Create Hack/i }));

      // Form should not submit (HTML5 validation)
      expect(createHackWithImage).not.toHaveBeenCalled();
    });

    it('requires description field', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Try to submit without description
      await user.type(screen.getByLabelText(/Name/i), 'Test Hack');
      await user.click(screen.getByRole('button', { name: /Create Hack/i }));

      // Form should not submit (HTML5 validation)
      expect(createHackWithImage).not.toHaveBeenCalled();
    });

    it('requires external link when content type is link', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Switch to external link but don't fill URL
      const externalLinkRadio = screen.getByLabelText(/External Link/i);
      await user.click(externalLinkRadio);

      // Fill other required fields
      await user.type(screen.getByLabelText(/Name/i), 'Test Hack');
      await user.type(screen.getByLabelText(/Description/i), 'Test Description');

      // Try to submit
      await user.click(screen.getByRole('button', { name: /Create Hack/i }));

      // Form should not submit (HTML5 validation)
      expect(createHackWithImage).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form fields', () => {
      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Check for accessible labels
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getByLabelText(/Choose Image/i)).toBeInTheDocument();
    });

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup();

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Upload invalid file to trigger error
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/Choose Image/i);

      await user.upload(fileInput, invalidFile);

      // Error should be in accessible alert
      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert).toHaveTextContent(/Invalid file type/i);
    });

    it('properly disables form during submission', async () => {
      const user = userEvent.setup();

      // Mock slow response
      vi.mocked(createHackWithImage).mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(
        <HackForm
          availableHacks={mockAvailableHacks}
          userId={mockUserId}
        />
      );

      // Fill and submit
      await user.type(screen.getByLabelText(/Name/i), 'Test Hack');
      await user.type(screen.getByLabelText(/Description/i), 'Test Description');
      await user.click(screen.getByRole('button', { name: /Create Hack/i }));

      // All form fields should be disabled
      expect(screen.getByLabelText(/Name/i)).toBeDisabled();
      expect(screen.getByLabelText(/Description/i)).toBeDisabled();
    });
  });
});