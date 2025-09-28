'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MediaEmbed } from '@/components/ui/media-embed';
import { X, Play } from 'lucide-react';

interface MediaInputProps {
  mediaType: string;
  mediaUrl: string;
  onTypeChange: (type: string) => void;
  onUrlChange: (url: string) => void;
  label?: string;
}

export function MediaInput({
  mediaType,
  mediaUrl,
  onTypeChange,
  onUrlChange,
  label = 'Media'
}: MediaInputProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleClear = () => {
    onTypeChange('none');
    onUrlChange('');
    setShowPreview(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          <Select value={mediaType} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select media type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="mp3">MP3 Audio</SelectItem>
              <SelectItem value="video">Video File</SelectItem>
              <SelectItem value="audio">Audio File</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder={
              mediaType === 'youtube' ? 'YouTube URL or Video ID' :
              mediaType === 'tiktok' ? 'TikTok URL' :
              mediaType === 'mp3' ? 'MP3 URL' :
              mediaType ? `${mediaType} URL` :
              'Select a media type first'
            }
            value={mediaUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            disabled={!mediaType || mediaType === 'none'}
            className="md:col-span-2"
          />
        </div>
      </div>

      {mediaType && mediaType !== 'none' && mediaUrl && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Play className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      )}

      {showPreview && mediaType && mediaType !== 'none' && mediaUrl && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <MediaEmbed
            type={mediaType}
            url={mediaUrl}
            title="Media Preview"
          />
        </div>
      )}

      {mediaType && mediaType !== 'none' && (
        <div className="text-xs text-gray-500">
          {mediaType === 'youtube' && (
            <p>Enter a YouTube URL (e.g., https://youtube.com/watch?v=VIDEO_ID) or just the video ID</p>
          )}
          {mediaType === 'tiktok' && (
            <p>Enter a TikTok video URL</p>
          )}
          {mediaType === 'mp3' && (
            <p>Enter a direct link to an MP3 file</p>
          )}
          {mediaType === 'video' && (
            <p>Enter a direct link to a video file (MP4, WebM)</p>
          )}
          {mediaType === 'audio' && (
            <p>Enter a direct link to an audio file</p>
          )}
        </div>
      )}
    </div>
  );
}