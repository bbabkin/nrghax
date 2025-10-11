/**
 * YouTube utility functions for extracting video information
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if a URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

/**
 * Convert ISO 8601 duration (PT1H2M10S) to minutes
 * Examples:
 * - PT1H2M10S -> 62
 * - PT45M -> 45
 * - PT30S -> 1 (rounds up to 1 minute)
 */
export function parseISO8601Duration(duration: string): number {
  if (!duration) return 0;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  // Convert to total minutes, round up if there are any seconds
  const totalMinutes = hours * 60 + minutes + (seconds > 0 ? 1 : 0);

  return totalMinutes;
}

/**
 * Fetch YouTube video duration using YouTube Data API
 * Note: Requires YOUTUBE_API_KEY environment variable
 */
export async function fetchYouTubeDuration(videoId: string): Promise<number | null> {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn('YouTube API key not found. Cannot fetch video duration.');
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`
    );

    if (!response.ok) {
      console.error('YouTube API request failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.warn('No video found with ID:', videoId);
      return null;
    }

    const duration = data.items[0].contentDetails.duration;
    return parseISO8601Duration(duration);
  } catch (error) {
    console.error('Error fetching YouTube video duration:', error);
    return null;
  }
}

/**
 * Format duration in minutes to human-readable format
 * Examples:
 * - 45 -> "45 min"
 * - 90 -> "1h 30m"
 * - 120 -> "2h"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '';

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}
