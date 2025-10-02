import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get the latest custom questions
    const { data: customQuestions, error } = await supabase
      .from('onboarding_questions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching onboarding questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({ questions: customQuestions?.questions || null })
  } catch (error) {
    console.error('Error in GET /api/admin/onboarding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get questions from request body
    const { questions } = await request.json()

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid questions data' }, { status: 400 })
    }

    // Validate question structure
    for (const q of questions) {
      if (!q.id || !q.title || !q.type || !q.category || !Array.isArray(q.options)) {
        return NextResponse.json(
          { error: 'Invalid question structure - missing required fields' },
          { status: 400 }
        )
      }
    }

    // Check if we have existing questions
    const { data: existing } = await supabase
      .from('onboarding_questions')
      .select('id')
      .limit(1)
      .maybeSingle()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('onboarding_questions')
        .update({ questions, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('onboarding_questions')
        .insert({ questions })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding questions saved successfully',
      data: result,
    })
  } catch (error) {
    console.error('Error saving onboarding questions:', error)
    return NextResponse.json(
      { error: 'Failed to save questions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
