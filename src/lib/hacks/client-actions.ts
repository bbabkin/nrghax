'use client';

import { createClient } from '@/lib/supabase/client';
import { uploadHackImage } from '@/lib/storage/upload';
import { createHack, updateHack, HackFormData } from './actions';

export interface HackFormClientData {
  name: string;
  description: string;
  imageFile?: File | null;
  existingImageUrl?: string;
  existingImagePath?: string;
  content_type: 'content' | 'link';
  content_body?: string | null;
  external_link?: string | null;
  prerequisite_ids?: string[];
}

export async function createHackWithImage(data: HackFormClientData, userId: string) {
  let imagePath: string | undefined;
  let imageUrl: string | undefined;

  console.log('[Client Action] Creating hack with image for user:', userId);
  console.log('[Client Action] Image data:', {
    hasFile: !!data.imageFile,
    hasExistingPath: !!data.existingImagePath,
    hasExistingUrl: !!data.existingImageUrl
  });

  // Upload image if a new file was selected
  if (data.imageFile) {
    try {
      console.log('[Client Action] Uploading new image...');
      const uploadResult = await uploadHackImage(data.imageFile, userId);
      imagePath = uploadResult.path;
      imageUrl = uploadResult.url;
      console.log('[Client Action] Image uploaded successfully:', { path: imagePath, url: imageUrl });
    } catch (uploadError) {
      console.error('[Client Action] Image upload failed:', uploadError);
      throw uploadError; // Re-throw with original error message
    }
  } else if (data.existingImagePath) {
    imagePath = data.existingImagePath;
    console.log('[Client Action] Using existing image path:', imagePath);
  } else if (data.existingImageUrl) {
    imageUrl = data.existingImageUrl;
    console.log('[Client Action] Using existing image URL:', imageUrl);
  } else {
    console.error('[Client Action] No image provided');
    throw new Error('Please select an image');
  }

  const formData: HackFormData = {
    name: data.name,
    description: data.description,
    image_url: imageUrl || '',
    image_path: imagePath,
    content_type: data.content_type,
    content_body: data.content_body,
    external_link: data.external_link,
    prerequisite_ids: data.prerequisite_ids,
  };

  return createHack(formData);
}

export async function updateHackWithImage(hackId: string, data: HackFormClientData, userId: string) {
  let imagePath: string | undefined;
  let imageUrl: string | undefined;

  // Upload image if a new file was selected
  if (data.imageFile) {
    const uploadResult = await uploadHackImage(data.imageFile, userId);
    imagePath = uploadResult.path;
    imageUrl = uploadResult.url;
  } else if (data.existingImagePath) {
    imagePath = data.existingImagePath;
  } else if (data.existingImageUrl) {
    imageUrl = data.existingImageUrl;
  } else {
    throw new Error('Please select an image');
  }

  const formData: HackFormData = {
    name: data.name,
    description: data.description,
    image_url: imageUrl || '',
    image_path: imagePath,
    content_type: data.content_type,
    content_body: data.content_body,
    external_link: data.external_link,
    prerequisite_ids: data.prerequisite_ids,
  };

  return updateHack(hackId, formData);
}