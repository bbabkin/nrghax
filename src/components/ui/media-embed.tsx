'use client';

import { useEffect, useState } from 'react';

interface MediaEmbedProps {
  type?: string | null;
  url?: string | null;
  title?: string;
  className?: string;
}

export function MediaEmbed({ type, url, title = 'Media', className = '' }: MediaEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState<string>('');

  useEffect(() => {
    if (!url) {
      setEmbedUrl('');
      return;
    }

    // Process URL based on type
    if (type === 'youtube') {
      // Extract YouTube video ID from various URL formats
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&#\n\?]+)/;
      const match = url.match(youtubeRegex);
      if (match) {
        setEmbedUrl(`https://www.youtube.com/embed/${match[1]}`);
      } else if (url.length === 11) {
        // Assume it's just the video ID
        setEmbedUrl(`https://www.youtube.com/embed/${url}`);
      }
    } else if (type === 'tiktok') {
      // TikTok embed requires special handling
      // For now, we'll just link to it
      setEmbedUrl(url);
    } else if (type === 'mp3' || type === 'audio') {
      setEmbedUrl(url);
    } else if (type === 'video') {
      setEmbedUrl(url);
    } else {
      setEmbedUrl(url);
    }
  }, [type, url]);

  if (!embedUrl) return null;

  // YouTube embed
  if (type === 'youtube') {
    return (
      <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
    );
  }

  // TikTok embed (requires TikTok's embed script, for now we'll show a link)
  if (type === 'tiktok') {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">TikTok Video:</p>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {embedUrl}
        </a>
      </div>
    );
  }

  // Audio player for MP3
  if (type === 'mp3' || type === 'audio') {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <audio controls className="w-full">
          <source src={embedUrl} type="audio/mpeg" />
          <source src={embedUrl} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // Video player
  if (type === 'video') {
    return (
      <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
        <video controls className="absolute top-0 left-0 w-full h-full">
          <source src={embedUrl} type="video/mp4" />
          <source src={embedUrl} type="video/webm" />
          Your browser does not support the video element.
        </video>
      </div>
    );
  }

  // Fallback: just show a link
  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <a
        href={embedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {title}
      </a>
    </div>
  );
}