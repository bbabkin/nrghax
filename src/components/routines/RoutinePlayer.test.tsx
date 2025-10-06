import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoutinePlayer } from './RoutinePlayer';
import { updateRoutinePosition } from '@/lib/routines/actions';

// Mock server actions
vi.mock('@/lib/routines/actions', () => ({
  updateRoutinePosition: vi.fn(),
  markHackComplete: vi.fn(),
}));

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useParams: () => ({
    slug: 'test-routine',
  }),
}));

describe('RoutinePlayer', () => {
  const mockHacks = [
    {
      id: 'hack-1',
      name: 'Morning Sunlight',
      slug: 'morning-sunlight',
      description: 'Get sunlight in the morning',
      mediaType: 'youtube',
      mediaUrl: 'https://www.youtube.com/watch?v=video1',
      contentType: 'content',
      contentBody: '<p>Content for hack 1</p>',
    },
    {
      id: 'hack-2',
      name: 'Cold Shower',
      slug: 'cold-shower',
      description: 'Take a cold shower',
      mediaType: 'youtube',
      mediaUrl: 'https://www.youtube.com/watch?v=video2',
      contentType: 'content',
      contentBody: '<p>Content for hack 2</p>',
    },
    {
      id: 'hack-3',
      name: 'Exercise',
      slug: 'exercise',
      description: 'Morning exercise routine',
      mediaType: 'video',
      mediaUrl: 'https://example.com/exercise.mp4',
      contentType: 'content',
      contentBody: '<p>Content for hack 3</p>',
    },
  ];

  const mockRoutine = {
    id: 'routine-1',
    name: 'Morning Routine',
    slug: 'morning-routine',
    description: 'Start your day right',
    hacks: mockHacks,
    currentPosition: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Player initialization', () => {
    it('should render the routine player with first hack', () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      expect(screen.getByText('Morning Routine')).toBeInTheDocument();
      expect(screen.getByText('Morning Sunlight')).toBeInTheDocument();
    });

    it('should show all hacks in the sidebar', () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      expect(screen.getByText('Morning Sunlight')).toBeInTheDocument();
      expect(screen.getByText('Cold Shower')).toBeInTheDocument();
      expect(screen.getByText('Exercise')).toBeInTheDocument();
    });

    it('should resume from saved position', () => {
      const routineWithPosition = { ...mockRoutine, currentPosition: 1 };
      render(<RoutinePlayer routine={routineWithPosition} user={{ id: 'user-1' }} />);

      // Should show second hack as current
      expect(screen.getByText('Cold Shower')).toBeInTheDocument();
    });

    it('should show progress bar with correct percentage', () => {
      const routineWithPosition = { ...mockRoutine, currentPosition: 1 };
      render(<RoutinePlayer routine={routineWithPosition} user={{ id: 'user-1' }} />);

      const progressBar = screen.getByRole('progressbar');
      // 1 out of 3 hacks completed = 33.33%
      expect(progressBar).toHaveAttribute('aria-valuenow', '33');
    });
  });

  describe('Auto-play functionality', () => {
    it('should auto-advance to next hack when video ends', async () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      // Get the video player component and simulate video end
      const videoPlayer = screen.getByTestId('video-player');

      // Trigger onEnded callback
      fireEvent(videoPlayer, new CustomEvent('videoended'));

      await waitFor(() => {
        // Should advance to second hack
        expect(screen.getByText('Cold Shower')).toBeInTheDocument();
      });

      // Should update position in database
      expect(updateRoutinePosition).toHaveBeenCalledWith('routine-1', 1);
    });

    it('should not auto-advance when autoplay is disabled', async () => {
      render(
        <RoutinePlayer
          routine={mockRoutine}
          user={{ id: 'user-1' }}
          autoplayEnabled={false}
        />
      );

      const videoPlayer = screen.getByTestId('video-player');
      fireEvent(videoPlayer, new CustomEvent('videoended'));

      await waitFor(() => {
        // Should stay on first hack
        expect(screen.getByText('Morning Sunlight')).toBeInTheDocument();
      });

      // Should show "Next" button
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should show completion screen when all hacks are finished', async () => {
      const routineNearEnd = { ...mockRoutine, currentPosition: 2 };
      render(<RoutinePlayer routine={routineNearEnd} user={{ id: 'user-1' }} />);

      const videoPlayer = screen.getByTestId('video-player');
      fireEvent(videoPlayer, new CustomEvent('videoended'));

      await waitFor(() => {
        expect(screen.getByText(/routine completed/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation controls', () => {
    it('should navigate to next hack when Next button is clicked', async () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Cold Shower')).toBeInTheDocument();
      });
    });

    it('should navigate to previous hack when Previous button is clicked', async () => {
      const routineWithPosition = { ...mockRoutine, currentPosition: 1 };
      render(<RoutinePlayer routine={routineWithPosition} user={{ id: 'user-1' }} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('Morning Sunlight')).toBeInTheDocument();
      });
    });

    it('should disable Previous button on first hack', () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should allow clicking on hack in sidebar to jump to it', async () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      const exerciseHack = screen.getAllByText('Exercise')[0];
      fireEvent.click(exerciseHack);

      await waitFor(() => {
        expect(updateRoutinePosition).toHaveBeenCalledWith('routine-1', 2);
      });
    });
  });

  describe('Progress tracking', () => {
    it('should save progress to database when hack changes', async () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(updateRoutinePosition).toHaveBeenCalledWith('routine-1', 1);
      });
    });

    it('should mark completed hacks in sidebar', async () => {
      const routineWithPosition = { ...mockRoutine, currentPosition: 1 };
      render(<RoutinePlayer routine={routineWithPosition} user={{ id: 'user-1' }} />);

      // First hack should be marked as completed
      const firstHack = screen.getAllByText('Morning Sunlight')[0];
      expect(firstHack.parentElement).toHaveClass('completed');
    });

    it('should highlight current hack in sidebar', () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      const currentHack = screen.getAllByText('Morning Sunlight')[0];
      expect(currentHack.parentElement).toHaveClass('current');
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should toggle play/pause with spacebar', async () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      fireEvent.keyDown(document, { key: ' ', code: 'Space' });

      await waitFor(() => {
        // Should pause the video
        expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      });
    });

    it('should navigate with arrow keys', async () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      // Right arrow = next
      fireEvent.keyDown(document, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Cold Shower')).toBeInTheDocument();
      });

      // Left arrow = previous
      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.getByText('Morning Sunlight')).toBeInTheDocument();
      });
    });

    it('should exit player with Escape key', async () => {
      const mockPush = vi.fn();
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        refresh: vi.fn(),
      });

      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/routines/morning-routine');
      });
    });
  });

  describe('Content types', () => {
    it('should render video player for YouTube hacks', () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      expect(screen.getByTestId('video-player')).toBeInTheDocument();
    });

    it('should render HTML5 video player for self-hosted videos', () => {
      const routineWithVideo = { ...mockRoutine, currentPosition: 2 };
      render(<RoutinePlayer routine={routineWithVideo} user={{ id: 'user-1' }} />);

      expect(screen.getByTestId('video-player')).toBeInTheDocument();
    });

    it('should render content body for text-only hacks', () => {
      const textHack = {
        ...mockHacks[0],
        mediaType: null,
        mediaUrl: null,
      };
      const routineWithText = { ...mockRoutine, hacks: [textHack] };

      render(<RoutinePlayer routine={routineWithText} user={{ id: 'user-1' }} />);

      expect(screen.getByText('Content for hack 1')).toBeInTheDocument();
    });

    it('should show manual advance button for text content', () => {
      const textHack = {
        ...mockHacks[0],
        mediaType: null,
        mediaUrl: null,
      };
      const routineWithText = { ...mockRoutine, hacks: [textHack, mockHacks[1]] };

      render(<RoutinePlayer routine={routineWithText} user={{ id: 'user-1' }} />);

      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });
  });

  describe('Mobile responsiveness', () => {
    it('should show collapsible sidebar on mobile', () => {
      // Mock mobile viewport
      global.innerWidth = 375;

      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      // Sidebar should be hidden by default on mobile
      const sidebar = screen.getByTestId('hack-sidebar');
      expect(sidebar).toHaveClass('hidden', 'md:block');

      // Should have toggle button
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle video loading errors gracefully', async () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      const videoPlayer = screen.getByTestId('video-player');
      fireEvent(videoPlayer, new CustomEvent('videoerror'));

      await waitFor(() => {
        expect(screen.getByText(/error loading video/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      });
    });

    it('should allow skipping failed video', async () => {
      render(<RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} />);

      const videoPlayer = screen.getByTestId('video-player');
      fireEvent(videoPlayer, new CustomEvent('videoerror'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        // Should advance to next hack
        expect(screen.getByText('Cold Shower')).toBeInTheDocument();
      });
    });
  });

  describe('Autoplay preferences', () => {
    it('should respect user autoplay preference', () => {
      const { rerender } = render(
        <RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} autoplayEnabled={true} />
      );

      expect(screen.getByTestId('autoplay-toggle')).toBeChecked();

      rerender(
        <RoutinePlayer routine={mockRoutine} user={{ id: 'user-1' }} autoplayEnabled={false} />
      );

      expect(screen.getByTestId('autoplay-toggle')).not.toBeChecked();
    });

    it('should toggle autoplay when switch is clicked', async () => {
      const onAutoplayChange = vi.fn();
      render(
        <RoutinePlayer
          routine={mockRoutine}
          user={{ id: 'user-1' }}
          onAutoplayChange={onAutoplayChange}
        />
      );

      const toggle = screen.getByTestId('autoplay-toggle');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(onAutoplayChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
