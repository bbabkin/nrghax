'use client'

import { createClient } from '@/lib/supabase/client'

interface OnboardingAnswers {
  experience_level?: string
  interest_areas?: string[]
  learning_goals?: string[]
  time_commitment?: string
  preferred_difficulty?: string
  skipped?: boolean
}

export async function assignTagsFromOnboarding(
  userId: string,
  answers: OnboardingAnswers | { skipped: boolean }
) {
  const supabase = createClient()

  // If user skipped onboarding, assign default beginner tag
  if ('skipped' in answers && answers.skipped) {
    const { data: beginnerTag } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', 'beginner')
      .eq('tag_type', 'user_experience')
      .single()

    if (beginnerTag) {
      await supabase
        .from('user_tags')
        .upsert({
          user_id: userId,
          tag_id: beginnerTag.id,
          source: 'onboarding',
          updated_at: new Date().toISOString()
        })
    }

    // Mark onboarding as skipped
    await supabase
      .from('onboarding_responses')
      .insert({
        user_id: userId,
        question_id: 'onboarding_skipped',
        answer: { skipped: true },
        skipped: true,
        completed_at: new Date().toISOString()
      })

    return
  }

  const fullAnswers = answers as OnboardingAnswers
  const tagAssignments: { user_id: string; tag_id: string; source: string; updated_at: string }[] = []

  // First, clear any existing onboarding tags for this user
  await supabase
    .from('user_tags')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'onboarding')

  // Assign experience level tag (mutually exclusive)
  if (fullAnswers.experience_level) {
    const { data: expTag } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', fullAnswers.experience_level)
      .eq('tag_type', 'user_experience')
      .single()

    if (expTag) {
      tagAssignments.push({
        user_id: userId,
        tag_id: expTag.id,
        source: 'onboarding',
        updated_at: new Date().toISOString()
      })
    }
  }

  // Assign interest area tags (can have multiple)
  if (fullAnswers.interest_areas && fullAnswers.interest_areas.length > 0) {
    const { data: interestTags } = await supabase
      .from('tags')
      .select('id, slug')
      .in('slug', fullAnswers.interest_areas)
      .eq('tag_type', 'user_interest')

    if (interestTags) {
      interestTags.forEach(tag => {
        tagAssignments.push({
          user_id: userId,
          tag_id: tag.id,
          source: 'onboarding',
          updated_at: new Date().toISOString()
        })
      })
    }
  }

  // Insert all tag assignments
  if (tagAssignments.length > 0) {
    await supabase
      .from('user_tags')
      .insert(tagAssignments)
  }

  // Store onboarding responses
  const responses = []
  for (const [questionId, answer] of Object.entries(fullAnswers)) {
    if (answer !== undefined) {
      responses.push({
        user_id: userId,
        question_id: questionId,
        answer: { value: answer },
        completed_at: new Date().toISOString()
      })
    }
  }

  if (responses.length > 0) {
    await supabase
      .from('onboarding_responses')
      .upsert(responses)
  }

  // Log the tag assignments for sync tracking
  for (const assignment of tagAssignments) {
    await supabase
      .from('tag_sync_log')
      .insert({
        user_id: userId,
        tag_id: assignment.tag_id,
        action: 'added',
        source: 'onboarding',
        target: 'web',
        new_value: { source: 'onboarding_completion' }
      })
  }

  // Trigger Discord sync if user has Discord connected
  const { data: profile } = await supabase
    .from('profiles')
    .select('discord_id')
    .eq('id', userId)
    .single()

  if (profile?.discord_id && tagAssignments.length > 0) {
    // Fire and forget - don't wait for sync to complete
    fetch('/api/discord/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        changes: tagAssignments.map(ta => ({
          tagId: ta.tag_id,
          action: 'add'
        }))
      })
    }).catch(err => console.error('Discord sync trigger failed:', err))
  }
}