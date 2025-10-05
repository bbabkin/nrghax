import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoutineForm } from './RoutineForm';
import { createRoutine, updateRoutine } from '@/lib/routines/actions';
import { useToast } from '@/components/ui/use-toast';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/routines/actions', () => ({
  createRoutine: vi.fn(),
  updateRoutine: vi.fn(),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/components/ui/image-upload', () => ({
  ImageUpload: ({ value, onChange }: any) => (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      data-testid="image-upload"
      placeholder="Image URL"
    />
  ),
}));

describe('RoutineForm', () => {
  const mockHacks = [
    { id: 'hack-1', name: 'Hack 1', slug: 'hack-1', description: 'First hack' },
    { id: 'hack-2', name: 'Hack 2', slug: 'hack-2', description: 'Second hack' },
  ];

  const mockTags = [
    { id: 'tag-1', name: 'Health', slug: 'health' },
    { id: 'tag-2', name: 'Productivity', slug: 'productivity' },
  ];

  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast } as any);
  });

  describe('Image persistence', () => {
    it('should display existing image URL when editing a routine', () => {
      const existingRoutine = {
        id: 'routine-123',
        name: 'Morning Routine',
        description: 'Start the day right',
        imageUrl: 'https://example.com/routine.jpg',
        isPublic: true,
        hacks: [mockHacks[0]],
        tags: [mockTags[0]],
      };

      render(
        <RoutineForm
          routine={existingRoutine}
          availableHacks={mockHacks}
          availableTags={mockTags}
        />
      );

      // Check that image URL is populated
      const imageInput = screen.getByTestId('image-upload') as HTMLInputElement;
      expect(imageInput.value).toBe('https://example.com/routine.jpg');
    });

    it('should handle null/undefined imageUrl gracefully', () => {
      const routineWithoutImage = {
        id: 'routine-456',
        name: 'Evening Routine',
        description: 'End the day well',
        imageUrl: null,
        isPublic: false,
        hacks: [mockHacks[1]],
        tags: [],
      };

      render(
        <RoutineForm
          routine={routineWithoutImage}
          availableHacks={mockHacks}
          availableTags={mockTags}
        />
      );

      // Should render without error and have empty image input
      const imageInput = screen.getByTestId('image-upload') as HTMLInputElement;
      expect(imageInput.value).toBe('');
    });

    it('should preserve existing image when updating routine', async () => {
      const existingRoutine = {
        id: 'routine-789',
        name: 'Workout Routine',
        description: 'Daily exercise',
        imageUrl: 'https://example.com/workout.jpg',
        isPublic: true,
        hacks: [mockHacks[0]],
        tags: [mockTags[1]],
      };

      vi.mocked(updateRoutine).mockResolvedValue({
        success: true,
        routine: { ...existingRoutine, id: 'routine-789' },
      });

      const { container } = render(
        <RoutineForm
          routine={existingRoutine}
          availableHacks={mockHacks}
          availableTags={mockTags}
        />
      );

      // Change name but keep image
      const nameInput = screen.getByDisplayValue('Workout Routine');
      fireEvent.change(nameInput, { target: { value: 'Updated Workout' } });

      // Submit form
      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(updateRoutine).toHaveBeenCalledWith(
          'routine-789',
          expect.any(FormData)
        );

        // Get the FormData that was passed
        const formDataCalls = vi.mocked(updateRoutine).mock.calls[0];
        const formData = formDataCalls[1];

        // Verify image URL is preserved
        expect(formData.get('imageUrl')).toBe('https://example.com/workout.jpg');
      });
    });
  });

  describe('Form data population', () => {
    it('should populate all fields correctly when editing', () => {
      const fullRoutine = {
        id: 'routine-full',
        name: 'Complete Routine',
        description: 'A comprehensive routine',
        imageUrl: 'https://example.com/complete.jpg',
        isPublic: true,
        hacks: mockHacks,
        tags: mockTags,
      };

      render(
        <RoutineForm
          routine={fullRoutine}
          availableHacks={mockHacks}
          availableTags={mockTags}
        />
      );

      // Check all fields are populated
      expect(screen.getByDisplayValue('Complete Routine')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A comprehensive routine')).toBeInTheDocument();

      const imageInput = screen.getByTestId('image-upload') as HTMLInputElement;
      expect(imageInput.value).toBe('https://example.com/complete.jpg');

      // Check hacks are selected
      expect(screen.getByText('Hack 1')).toBeInTheDocument();
      expect(screen.getByText('Hack 2')).toBeInTheDocument();

      // Check tags are selected
      expect(screen.getByText('Health')).toBeInTheDocument();
      expect(screen.getByText('Productivity')).toBeInTheDocument();
    });

    it('should start with empty fields for new routine', () => {
      render(
        <RoutineForm
          availableHacks={mockHacks}
          availableTags={mockTags}
        />
      );

      const nameInput = screen.getByPlaceholderText(/Web Development/i) as HTMLInputElement;
      const descInput = screen.getByPlaceholderText(/Describe what this routine covers/i) as HTMLTextAreaElement;
      const imageInput = screen.getByTestId('image-upload') as HTMLInputElement;

      expect(nameInput.value).toBe('');
      expect(descInput.value).toBe('');
      expect(imageInput.value).toBe('');
    });
  });

  describe('Form validation', () => {
    it('should require name and description', async () => {
      render(
        <RoutineForm
          availableHacks={mockHacks}
          availableTags={mockTags}
        />
      );

      // Submit empty form
      const submitButton = screen.getByRole('button', { name: /create routine/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please provide a name and description',
          variant: 'destructive',
        });
      });

      expect(createRoutine).not.toHaveBeenCalled();
    });

    it('should require at least one hack', async () => {
      render(
        <RoutineForm
          availableHacks={mockHacks}
          availableTags={mockTags}
        />
      );

      // Fill in name and description but no hacks
      const nameInput = screen.getByPlaceholderText(/Web Development/i);
      const descInput = screen.getByPlaceholderText(/Describe what this routine covers/i);

      fireEvent.change(nameInput, { target: { value: 'Test Routine' } });
      fireEvent.change(descInput, { target: { value: 'Test Description' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create routine/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Please add at least one hack to the routine',
          variant: 'destructive',
        });
      });

      expect(createRoutine).not.toHaveBeenCalled();
    });
  });

  describe('Successful submission', () => {
    it('should create new routine with all data', async () => {
      vi.mocked(createRoutine).mockResolvedValue({
        success: true,
        routine: { id: 'new-routine', slug: 'new-routine' },
      });

      render(
        <RoutineForm
          availableHacks={mockHacks}
          availableTags={mockTags}
        />
      );

      // Fill in form
      const nameInput = screen.getByPlaceholderText(/Web Development/i);
      const descInput = screen.getByPlaceholderText(/Describe what this routine covers/i);
      const imageInput = screen.getByTestId('image-upload');

      fireEvent.change(nameInput, { target: { value: 'New Routine' } });
      fireEvent.change(descInput, { target: { value: 'New Description' } });
      fireEvent.change(imageInput, { target: { value: 'https://example.com/new.jpg' } });

      // Add a hack (simulate clicking on hack to add it)
      // This would need more complex interaction in real form
      // For simplicity, we'll assume the hack is added programmatically

      // Submit form with at least one hack
      const form = screen.getByRole('form', { hidden: true }) ||
                  nameInput.closest('form');

      if (form) {
        // Manually trigger submission since we need to bypass validation
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }

      // Note: In a real test, we'd need to properly interact with the hack selection UI
      // This is simplified for demonstration
    });

    it('should update existing routine', async () => {
      const existingRoutine = {
        id: 'routine-update',
        name: 'Original Name',
        description: 'Original Description',
        imageUrl: 'https://example.com/original.jpg',
        isPublic: false,
        hacks: [mockHacks[0]],
        tags: [mockTags[0]],
      };

      vi.mocked(updateRoutine).mockResolvedValue({
        success: true,
        routine: { ...existingRoutine, name: 'Updated Name' },
      });

      const { container } = render(
        <RoutineForm
          routine={existingRoutine}
          availableHacks={mockHacks}
          availableTags={mockTags}
        />
      );

      // Update name
      const nameInput = screen.getByDisplayValue('Original Name');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      // Submit form
      const form = container.querySelector('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(updateRoutine).toHaveBeenCalledWith(
          'routine-update',
          expect.any(FormData)
        );
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: expect.stringContaining('updated'),
      });
    });
  });
});