import { createClient } from '@/lib/supabase/client';

export interface UploadResult {
  path: string;
  url: string;
}

export async function uploadHackImage(file: File, userId: string): Promise<UploadResult> {
  const supabase = createClient();
  
  console.log('[Upload Debug] Starting upload for user:', userId);
  console.log('[Upload Debug] File details:', {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeInMB: (file.size / 1024 / 1024).toFixed(2)
  });
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    const error = `Invalid file type: ${file.type}. Allowed types: ${validTypes.join(', ')}`;
    console.error('[Upload Debug] File type validation failed:', error);
    throw new Error(error);
  }
  
  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    const error = `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 5MB limit`;
    console.error('[Upload Debug] File size validation failed:', error);
    throw new Error(error);
  }
  
  // Generate unique filename with user folder
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  console.log('[Upload Debug] Generated filename:', fileName);
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[Upload Debug] Authentication error:', authError);
    throw new Error('You must be logged in to upload images');
  }
  console.log('[Upload Debug] Authenticated as:', user.email);
  
  // Upload to Supabase storage
  console.log('[Upload Debug] Uploading to bucket: hack-images');
  const { data, error } = await supabase.storage
    .from('hack-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('[Upload Debug] Supabase storage error:', {
      message: error.message,
      status: (error as any).statusCode || (error as any).status,
      error: error
    });
    
    // Provide more specific error messages
    if (error.message?.includes('row-level security')) {
      throw new Error('Permission denied: You do not have permission to upload images');
    } else if (error.message?.includes('bucket')) {
      throw new Error('Storage bucket not configured properly');
    } else if (error.message?.includes('Payload too large')) {
      throw new Error('File too large for server');
    } else if (error.message?.includes('Invalid')) {
      throw new Error(`Invalid request: ${error.message}`);
    } else {
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  console.log('[Upload Debug] Upload successful:', data);
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('hack-images')
    .getPublicUrl(data.path);
  
  // Fix URL if it's missing the host
  let finalUrl = publicUrl;
  if (publicUrl && !publicUrl.startsWith('http')) {
    // If URL doesn't start with http, prepend the Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    finalUrl = `${supabaseUrl}/storage/v1/object/public/hack-images/${data.path}`;
    console.log('[Upload Debug] Fixed URL from:', publicUrl, 'to:', finalUrl);
  } else {
    console.log('[Upload Debug] Public URL generated:', publicUrl);
  }
  
  return {
    path: data.path,
    url: finalUrl
  };
}

export async function deleteHackImage(path: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.storage
    .from('hack-images')
    .remove([path]);
  
  if (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete image.');
  }
}