import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { Tables } from '@/types/supabase'

export const getHacks = cache(async () => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hacks')
    .select(`
      *,
      hack_tags (
        tag:tags (*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching hacks:', error)
    return []
  }

  return data
})

export const getHackBySlug = cache(async (slug: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hacks')
    .select(`
      *,
      hack_tags (
        tag:tags (*)
      ),
      creator:profiles!created_by (
        id,
        name,
        avatar_url
      )
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching hack:', error)
    return null
  }

  return data
})

export const getUserHacks = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_hacks')
    .select(`
      *,
      hack:hacks (
        *,
        hack_tags (
          tag:tags (*)
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user hacks:', error)
    return []
  }

  return data
})

export const getPopularHacks = cache(async (limit = 10) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hack_details')
    .select('*')
    .order('likes_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching popular hacks:', error)
    return []
  }

  return data
})

export const searchHacks = cache(async (query: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hacks')
    .select(`
      *,
      hack_tags (
        tag:tags (*)
      )
    `)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching hacks:', error)
    return []
  }

  return data
})

export const getHacksByTag = cache(async (tagSlug: string) => {
  const supabase = await createClient()

  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', tagSlug)
    .single()

  if (tagError || !tag) {
    console.error('Error fetching tag:', tagError)
    return []
  }

  const { data, error } = await supabase
    .from('hack_tags')
    .select(`
      hack:hacks (
        *,
        hack_tags (
          tag:tags (*)
        )
      )
    `)
    .eq('tag_id', tag.id)

  if (error) {
    console.error('Error fetching hacks by tag:', error)
    return []
  }

  return data.map(item => item.hack).filter(Boolean)
})