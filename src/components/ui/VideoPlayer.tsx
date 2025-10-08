'use client';

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  type: 'youtube' | 'video' | string | null;
  url: string;
  autoplay?: boolean;
  onEnded?: () => void;
  onError?: (error: { type: string; message?: string }) => void;
  title?: string;
  className?: string;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ type, url, autoplay = false, onEnded, onError, title = 'Video', className = '' }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const ytPlayerRef = useRef<any>(null);
    const htmlVideoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose player controls via ref
    useImperativeHandle(ref, () => ({
      play: () => {
        console.log('VideoPlayer.play() called, type:', type, 'ytPlayerRef:', !!ytPlayerRef.current, 'htmlVideoRef:', !!htmlVideoRef.current, 'isReady:', isReady);

        // Try to play immediately if ready
        if (type === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.playVideo) {
          console.log('Calling YouTube playVideo()');
          try {
            ytPlayerRef.current.playVideo();
          } catch (err) {
            console.error('Error calling playVideo:', err);
          }
        } else if (htmlVideoRef.current) {
          console.log('Calling HTML5 video play()');
          htmlVideoRef.current.play().catch(err => console.error('HTML5 play error:', err));
        } else if (!isReady) {
          console.log('Player not ready yet, will retry in 500ms');
          // If not ready, retry after a short delay
          setTimeout(() => {
            if (type === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.playVideo) {
              console.log('Retry: Calling YouTube playVideo()');
              ytPlayerRef.current.playVideo();
            } else if (htmlVideoRef.current) {
              console.log('Retry: Calling HTML5 video play()');
              htmlVideoRef.current.play().catch(err => console.error('HTML5 play error (retry):', err));
            }
          }, 500);
        } else {
          console.log('Cannot play - no player ref available');
        }
      },
      pause: () => {
        if (type === 'youtube' && ytPlayerRef.current) {
          ytPlayerRef.current.pauseVideo();
        } else if (htmlVideoRef.current) {
          htmlVideoRef.current.pause();
        }
      },
      stop: () => {
        if (type === 'youtube' && ytPlayerRef.current) {
          ytPlayerRef.current.stopVideo();
        } else if (htmlVideoRef.current) {
          htmlVideoRef.current.pause();
          htmlVideoRef.current.currentTime = 0;
        }
      },
      getCurrentTime: () => {
        if (type === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          return ytPlayerRef.current.getCurrentTime();
        } else if (htmlVideoRef.current) {
          return htmlVideoRef.current.currentTime;
        }
        return 0;
      },
      seekTo: (seconds: number) => {
        if (type === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.seekTo) {
          ytPlayerRef.current.seekTo(seconds, true);
        } else if (htmlVideoRef.current) {
          htmlVideoRef.current.currentTime = seconds;
        }
      },
    }), [type, isReady]);

    // Extract YouTube video ID
    const extractYouTubeId = (url: string): string | null => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&#\n\?]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      // Check if it's just the ID
      if (url.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(url)) {
        return url;
      }

      return null;
    };

    // YouTube Player
    useEffect(() => {
      if (type !== 'youtube') return;

      const videoId = extractYouTubeId(url);
      if (!videoId) {
        setError('Invalid YouTube URL');
        onError?.({ type: 'invalid_url', message: 'Could not extract video ID from URL' });
        setIsLoading(false);
        return;
      }

      // Load YouTube IFrame API
      const loadYouTubeAPI = () => {
        if (window.YT && window.YT.Player) {
          initializePlayer();
          return;
        }

        // Add script if not already loaded
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // Set callback
        window.onYouTubeIframeAPIReady = initializePlayer;

        // Timeout for API load
        setTimeout(() => {
          if (!window.YT || !window.YT.Player) {
            setError('Failed to load YouTube player');
            onError?.({ type: 'api_load_error', message: 'YouTube API failed to load' });
            setIsLoading(false);
          }
        }, 10000);
      };

      const initializePlayer = () => {
        if (!containerRef.current) return;

        const playerId = `youtube-player-${Math.random().toString(36).substr(2, 9)}`;
        const playerDiv = document.createElement('div');
        playerDiv.id = playerId;
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(playerDiv);

        try {
          ytPlayerRef.current = new window.YT.Player(playerId, {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
              autoplay: autoplay ? 1 : 0,
              rel: 0,
              modestbranding: 1,
            },
            events: {
              onReady: (event: any) => {
                console.log('YouTube player ready');
                setIsLoading(false);
                setIsReady(true);
                if (autoplay) {
                  event.target.playVideo();
                }
              },
              onStateChange: (event: any) => {
                console.log('YouTube player state changed:', event.data, 'ENDED:', window.YT.PlayerState.ENDED);
                if (event.data === window.YT.PlayerState.ENDED) {
                  console.log('YouTube video ended, calling onEnded callback');
                  onEnded?.();
                }
              },
              onError: (event: any) => {
                setError('Video playback error');
                onError?.({ type: 'playback_error', message: `Error code: ${event.data}` });
                setIsLoading(false);
              },
            },
          });
        } catch (err: any) {
          setError('Failed to initialize player');
          onError?.({ type: 'init_error', message: err.message });
          setIsLoading(false);
        }
      };

      loadYouTubeAPI();

      return () => {
        if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
          ytPlayerRef.current.destroy();
        }
      };
    }, [type, url, autoplay, onEnded, onError]);

    // HTML5 Video
    useEffect(() => {
      if (type !== 'video' && type !== 'mp4' && type !== 'webm') return;

      const video = htmlVideoRef.current;
      if (!video) return;

      const handleEnded = () => {
        onEnded?.();
      };

      const handleError = () => {
        setError('Failed to load video');
        onError?.({ type: 'load_error', message: 'Video failed to load' });
      };

      const handleLoadedData = () => {
        console.log('HTML5 video loaded');
        setIsLoading(false);
        setIsReady(true);
      };

      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);
      video.addEventListener('loadeddata', handleLoadedData);

      if (autoplay) {
        video.play().catch(err => {
          console.warn('Autoplay prevented:', err);
        });
      }

      return () => {
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }, [type, url, autoplay, onEnded, onError]);

    // YouTube player
    if (type === 'youtube') {
      return (
        <div className={`relative w-full ${className}`} data-testid="video-player">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-2 text-white">Loading video...</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4 text-center">
                <div>
                  <p className="font-semibold mb-2">Error loading video</p>
                  <p className="text-sm text-gray-400">{error}</p>
                </div>
              </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
          </div>
        </div>
      );
    }

    // HTML5 video player
    if (type === 'video' || type === 'mp4' || type === 'webm') {
      return (
        <div className={`relative w-full ${className}`} data-testid="video-player">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-2 text-white">Loading video...</span>
              </div>
            )}
            <video
              ref={htmlVideoRef}
              data-testid="html5-video"
              className="absolute top-0 left-0 w-full h-full"
              controls
              autoPlay={autoplay}
              playsInline
            >
              <source src={url} type="video/mp4" />
              <source src={url} type="video/webm" />
              Your browser does not support the video element.
            </video>
          </div>
        </div>
      );
    }

    return null;
  }
);

VideoPlayer.displayName = 'VideoPlayer';
