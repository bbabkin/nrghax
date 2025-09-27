'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ImageUploadProps {
  bucket: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  bucket,
  value,
  onChange,
  label = 'Upload Image',
  maxSizeMB = 10
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `Please select an image smaller than ${maxSizeMB}MB`,
        variant: 'destructive'
      });
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${timestamp}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setPreview(publicUrl);
      onChange(publicUrl);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {preview ? (
        <div className="relative rounded-lg border overflow-hidden">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-48 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF or WebP (max {maxSizeMB}MB)
          </p>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={isUploading}
        className="hidden"
      />

      {!preview && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Choose Image'}
        </Button>
      )}
    </div>
  );
}