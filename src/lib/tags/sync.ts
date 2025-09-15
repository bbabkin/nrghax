import { createClient } from '@/lib/supabase/server'

export interface DiscordRoleChange {
  userId: string
  discordId: string
  action: 'add' | 'remove'
  roleName: string
  roleId: string
  timestamp: string
}

export interface SyncResult {
  success: boolean
  added: string[]
  removed: string[]
  conflicts: string[]
  error?: string
}

/**
 * Process Discord role changes and sync to web tags
 * Called by webhook when Discord bot detects role changes
 */
export async function syncDiscordRoleToWeb(change: DiscordRoleChange): Promise<SyncResult> {
  const supabase = await createClient()

  try {
    // Find user by Discord ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('discord_id', change.discordId)
      .single()

    if (!profile) {
      return {
        success: false,
        added: [],
        removed: [],
        conflicts: [],
        error: 'User not found with Discord ID'
      }
    }

    // Find tag by Discord role name or ID
    const { data: tag } = await supabase
      .from('tags')
      .select('*')
      .or(`discord_role_name.eq.${change.roleName},discord_role_id.eq.${change.roleId}`)
      .single()

    if (!tag) {
      // Role doesn't have a corresponding tag, skip
      return {
        success: true,
        added: [],
        removed: [],
        conflicts: [],
      }
    }

    if (change.action === 'add') {
      // Check for conflicts with mutually exclusive tags
      if (tag.tag_type === 'user_experience') {
        // Remove existing experience tags (trigger will handle this)
      }

      // Add the tag
      const { error } = await supabase
        .from('user_tags')
        .upsert({
          user_id: profile.id,
          tag_id: tag.id,
          source: 'discord',
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Log the sync
      await supabase
        .from('tag_sync_log')
        .insert({
          user_id: profile.id,
          tag_id: tag.id,
          action: 'added',
          source: 'discord',
          target: 'web',
          new_value: {
            role_name: change.roleName,
            role_id: change.roleId,
            synced_at: change.timestamp
          }
        })

      return {
        success: true,
        added: [tag.name],
        removed: [],
        conflicts: []
      }
    } else {
      // Remove the tag
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('user_id', profile.id)
        .eq('tag_id', tag.id)

      if (error) throw error

      // Log the sync
      await supabase
        .from('tag_sync_log')
        .insert({
          user_id: profile.id,
          tag_id: tag.id,
          action: 'removed',
          source: 'discord',
          target: 'web',
          previous_value: {
            role_name: change.roleName,
            role_id: change.roleId,
            removed_at: change.timestamp
          }
        })

      return {
        success: true,
        added: [],
        removed: [tag.name],
        conflicts: []
      }
    }
  } catch (error) {
    console.error('Discord sync error:', error)
    return {
      success: false,
      added: [],
      removed: [],
      conflicts: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Sync web tags to Discord roles
 * Called when tags are updated on the web
 */
export async function syncWebTagsToDiscord(
  userId: string,
  tagChanges: Array<{ tagId: string; action: 'add' | 'remove' }>
): Promise<SyncResult> {
  const supabase = await createClient()

  try {
    // Get user's Discord ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('discord_id')
      .eq('id', userId)
      .single()

    if (!profile?.discord_id) {
      return {
        success: false,
        added: [],
        removed: [],
        conflicts: [],
        error: 'User has not connected Discord'
      }
    }

    // Get tag details for all changes
    const tagIds = tagChanges.map(c => c.tagId)
    const { data: tags } = await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds)

    if (!tags || tags.length === 0) {
      return {
        success: false,
        added: [],
        removed: [],
        conflicts: [],
        error: 'Tags not found'
      }
    }

    // Prepare Discord bot webhook payload
    const discordUpdates = tags
      .filter(tag => tag.discord_role_name || tag.discord_role_id)
      .map(tag => {
        const change = tagChanges.find(c => c.tagId === tag.id)
        return {
          action: change?.action,
          roleId: tag.discord_role_id,
          roleName: tag.discord_role_name,
          tagName: tag.name,
          tagType: tag.tag_type
        }
      })

    if (discordUpdates.length === 0) {
      return {
        success: true,
        added: [],
        removed: [],
        conflicts: [],
      }
    }

    // Send webhook to Discord bot
    const webhookUrl = process.env.DISCORD_BOT_WEBHOOK_URL
    if (!webhookUrl) {
      console.error('DISCORD_BOT_WEBHOOK_URL not configured')
      return {
        success: false,
        added: [],
        removed: [],
        conflicts: [],
        error: 'Discord webhook not configured'
      }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.DISCORD_WEBHOOK_SECRET || ''
      },
      body: JSON.stringify({
        type: 'ROLE_SYNC',
        discordId: profile.discord_id,
        updates: discordUpdates,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Discord bot webhook failed: ${response.statusText}`)
    }

    const result = await response.json()

    // Log successful syncs
    for (const update of discordUpdates) {
      const tag = tags.find(t => t.discord_role_name === update.roleName)
      if (tag) {
        await supabase
          .from('tag_sync_log')
          .insert({
            user_id: userId,
            tag_id: tag.id,
            action: update.action === 'add' ? 'added' : 'removed',
            source: 'web',
            target: 'discord',
            new_value: {
              discord_role: update.roleName,
              synced_at: new Date().toISOString()
            }
          })
      }
    }

    return {
      success: true,
      added: discordUpdates.filter(u => u.action === 'add').map(u => u.tagName),
      removed: discordUpdates.filter(u => u.action === 'remove').map(u => u.tagName),
      conflicts: []
    }
  } catch (error) {
    console.error('Web to Discord sync error:', error)
    return {
      success: false,
      added: [],
      removed: [],
      conflicts: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get sync status for a user
 */
export async function getUserSyncStatus(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('discord_id, discord_username')
    .eq('id', userId)
    .single()

  const { data: recentSyncs } = await supabase
    .from('tag_sync_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    discordConnected: !!profile?.discord_id,
    discordUsername: profile?.discord_username,
    recentSyncs: recentSyncs || []
  }
}