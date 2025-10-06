import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';

// Mock YouTube IFrame API
const mockYouTubePlayer = {
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  stopVideo: vi.fn(),
  getPlayerState: vi.fn(() => 1), // 1 = playing
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

global.YT = {
  Player: vi.fn(() => mockYouTubePlayer),
  PlayerState: {
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
  },
} as any;

describe('VideoPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('YouTube video playback', () => {
    it('should render YouTube player with correct video ID', async () => {
      const onEnded = vi.fn();
      render(
        <VideoPlayer
          type="youtube"
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          onEnded={onEnded}
        />
      );

      await waitFor(() => {
        expect(global.YT.Player).toHaveBeenCalled();
      });
    });

    it('should call onEnded callback when YouTube video ends', async () => {
      const onEnded = vi.fn();
      let onStateChangeCallback: any;

      // Capture the onStateChange callback
      (global.YT.Player as any).mockImplementation((elementId: string, config: any) => {
        onStateChangeCallback = config.events.onStateChange;
        return mockYouTubePlayer;
      });

      render(
        <VideoPlayer
          type="youtube"
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          onEnded={onEnded}
        />
      );

      await waitFor(() => {
        expect(global.YT.Player).toHaveBeenCalled();
      });

      // Simulate video ending
      onStateChangeCallback({ data: global.YT.PlayerState.ENDED });

      await waitFor(() => {
        expect(onEnded).toHaveBeenCalledTimes(1);
      });
    });

    it('should extract video ID from various YouTube URL formats', async () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/v/dQw4w9WgXcQ',
      ];

      for (const url of urls) {
        const { unmount } = render(
          <VideoPlayer type="youtube" url={url} onEnded={vi.fn()} />
        );

        await waitFor(() => {
          expect(global.YT.Player).toHaveBeenCalled();
        });

        unmount();
        vi.clearAllMocks();
      }
    });

    it('should support autoplay when specified', async () => {
      render(
        <VideoPlayer
          type="youtube"
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          autoplay
          onEnded={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(global.YT.Player).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            playerVars: expect.objectContaining({
              autoplay: 1,
            }),
          })
        );
      });
    });
  });

  describe('HTML5 video playback', () => {
    it('should render HTML5 video player for self-hosted videos', () => {
      render(
        <VideoPlayer
          type="video"
          url="https://example.com/video.mp4"
          onEnded={vi.fn()}
        />
      );

      const videoElement = screen.getByTestId('html5-video') as HTMLVideoElement;
      expect(videoElement).toBeInTheDocument();
      expect(videoElement.src).toContain('video.mp4');
    });

    it('should call onEnded when HTML5 video ends', async () => {
      const onEnded = vi.fn();
      render(
        <VideoPlayer
          type="video"
          url="https://example.com/video.mp4"
          onEnded={onEnded}
        />
      );

      const videoElement = screen.getByTestId('html5-video') as HTMLVideoElement;

      // Simulate video ending
      videoElement.dispatchEvent(new Event('ended'));

      await waitFor(() => {
        expect(onEnded).toHaveBeenCalledTimes(1);
      });
    });

    it('should support autoplay for HTML5 video', () => {
      render(
        <VideoPlayer
          type="video"
          url="https://example.com/video.mp4"
          autoplay
          onEnded={vi.fn()}
        />
      );

      const videoElement = screen.getByTestId('html5-video') as HTMLVideoElement;
      expect(videoElement.autoplay).toBe(true);
    });

    it('should handle video loading errors gracefully', async () => {
      const onError = vi.fn();
      render(
        <VideoPlayer
          type="video"
          url="https://example.com/invalid-video.mp4"
          onEnded={vi.fn()}
          onError={onError}
        />
      );

      const videoElement = screen.getByTestId('html5-video') as HTMLVideoElement;

      // Simulate loading error
      videoElement.dispatchEvent(new Event('error'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Player controls', () => {
    it('should expose play method', async () => {
      const ref = { current: null } as any;
      render(
        <VideoPlayer
          ref={ref}
          type="youtube"
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          onEnded={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(ref.current).toBeTruthy();
      });

      ref.current.play();
      expect(mockYouTubePlayer.playVideo).toHaveBeenCalled();
    });

    it('should expose pause method', async () => {
      const ref = { current: null } as any;
      render(
        <VideoPlayer
          ref={ref}
          type="youtube"
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          onEnded={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(ref.current).toBeTruthy();
      });

      ref.current.pause();
      expect(mockYouTubePlayer.pauseVideo).toHaveBeenCalled();
    });
  });

  describe('Loading states', () => {
    it('should show loading indicator while video is loading', () => {
      render(
        <VideoPlayer
          type="youtube"
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          onEnded={vi.fn()}
        />
      );

      // Before YouTube API loads
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should hide loading indicator when video is ready', async () => {
      let onReadyCallback: any;

      (global.YT.Player as any).mockImplementation((elementId: string, config: any) => {
        onReadyCallback = config.events.onReady;
        return mockYouTubePlayer;
      });

      render(
        <VideoPlayer
          type="youtube"
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          onEnded={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(global.YT.Player).toHaveBeenCalled();
      });

      // Simulate player ready
      onReadyCallback();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle invalid YouTube URL gracefully', () => {
      const onError = vi.fn();
      render(
        <VideoPlayer
          type="youtube"
          url="not-a-valid-url"
          onEnded={vi.fn()}
          onError={onError}
        />
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'invalid_url',
        })
      );
    });

    it('should handle YouTube API load failure', async () => {
      const onError = vi.fn();

      // Temporarily remove YT global
      const originalYT = global.YT;
      delete (global as any).YT;

      render(
        <VideoPlayer
          type="youtube"
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          onEnded={vi.fn()}
          onError={onError}
        />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'api_load_error',
          })
        );
      });

      // Restore YT global
      global.YT = originalYT;
    });
  });
});
