import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hackId: string }> }
) {
  try {
    const { hackId } = await params;
    const supabase = await createClient();
    
    // Get tags for this hack
    const { data: hackTags, error } = await supabase
      .from('hack_tags')
      .select('tag_id, tags(id, name, color)')
      .eq('hack_id', hackId);
    
    if (error) throw error;
    
    // Extract the tag objects
    const tags = hackTags?.map(ht => ht.tags).filter(Boolean) || [];
    
    return NextResponse.json(tags);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hack tags' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ hackId: string }> }
) {
  try {
    const { hackId } = await params;
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { tag_ids } = await request.json();
    
    // Delete existing tags for this hack
    await supabase
      .from('hack_tags')
      .delete()
      .eq('hack_id', hackId);
    
    // Insert new tags
    if (tag_ids && tag_ids.length > 0) {
      const hackTags = tag_ids.map((tagId: string) => ({
        hack_id: hackId,
        tag_id: tagId,
        assigned_by: user.id
      }));
      
      const { error: insertError } = await supabase
        .from('hack_tags')
        .insert(hackTags);
      
      if (insertError) throw insertError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update hack tags' },
      { status: 500 }
    );
  }
}