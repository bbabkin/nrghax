import { NextRequest, NextResponse } from 'next/server'
import { syncDiscordRoleToWeb, type DiscordRoleChange } from '@/lib/tags/sync'

// Verify webhook secret to ensure requests come from our Discord bot
function verifyWebhookSecret(request: NextRequest): boolean {
  const secret = request.headers.get('X-Webhook-Secret')
  const expectedSecret = process.env.DISCORD_WEBHOOK_SECRET

  if (!expectedSecret) {
    console.warn('DISCORD_WEBHOOK_SECRET not configured')
    return false
  }

  return secret === expectedSecret
}

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook secret
    if (!verifyWebhookSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate webhook type
    if (body.type !== 'ROLE_CHANGE') {
      return NextResponse.json(
        { error: 'Invalid webhook type' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.userId || !body.discordId || !body.changes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process each role change
    const results = []
    for (const change of body.changes) {
      const roleChange: DiscordRoleChange = {
        userId: body.userId,
        discordId: body.discordId,
        action: change.action,
        roleName: change.roleName,
        roleId: change.roleId,
        timestamp: change.timestamp || new Date().toISOString()
      }

      const result = await syncDiscordRoleToWeb(roleChange)
      results.push({
        role: change.roleName,
        ...result
      })
    }

    // Check if all syncs were successful
    const allSuccessful = results.every(r => r.success)

    return NextResponse.json({
      success: allSuccessful,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Discord webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint for the bot to verify webhook is working
export async function GET(request: NextRequest) {
  // Verify the webhook secret for health checks too
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/discord/webhook',
    timestamp: new Date().toISOString()
  })
}