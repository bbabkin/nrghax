'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';

interface RoutineImageUploadProps {
  routineId?: string;
  currentImageUrl?: string | null;
  currentImagePath?: string | null;
  onImageUploaded: (path: string, url: string) => void;
  isNew?: boolean;
}

export function RoutineImageUpload({
  routineId,
  currentImageUrl,
  currentImagePath,
  onImageUploaded,
  isNew = false
}: RoutineImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImagePath
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/routine-images/${currentImagePath}`
      : currentImageUrl
  );
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, WebP, or SVG)',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = isNew
        ? `temp-${Date.now()}.${fileExt}`
        : `${routineId}.${fileExt}`;
      const filePath = fileName;

      // Delete old image if exists and not a new routine
      if (!isNew && currentImagePath) {
        await supabase.storage
          .from('routine-images')
          .remove([currentImagePath]);
      }

      // Upload new image
      const { data, error } = await supabase.storage
        .from('routine-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: !isNew
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('routine-images')
        .getPublicUrl(filePath);

      // Update preview
      setPreviewUrl(publicUrl);

      // Notify parent component
      onImageUploaded(filePath, publicUrl);

      toast({
        title: 'Image uploaded',
        description: 'Your routine image has been uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded('', '');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Label className="text-base font-semibold mb-4 block">
          Routine Cover Image
        </Label>

        {previewUrl ? (
          <div className="relative group">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={previewUrl}
                alt="Routine cover"
                fill
                className="object-cover"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300" />
              <div className="mt-4">
                <Label
                  htmlFor="routine-image"
                  className="cursor-pointer text-primary hover:text-primary/80"
                >
                  <span className="mt-2 block text-sm font-medium">
                    Click to upload an image
                  </span>
                </Label>
                <Input
                  id="routine-image"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300 dark:text-gray-500">
                  JPG, PNG, WebP or SVG up to 10MB
                </p>
              </div>
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-4 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Uploading...</span>
          </div>
        )}

        {!previewUrl && !uploading && (
          <div className="mt-4">
            <Label
              htmlFor="routine-image-button"
              className="cursor-pointer"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('routine-image-button')?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
            </Label>
            <Input
              id="routine-image-button"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}