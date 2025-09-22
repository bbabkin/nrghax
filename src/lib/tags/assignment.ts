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
      .or('slug.eq.beginner,slug.eq.beginner-friendly,name.ilike.%beginner%')
      .limit(1)
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

    // Mark user as onboarded even if skipped
    await supabase
      .from('profiles')
      .update({ onboarded: true })
      .eq('id', userId)

    // Mark onboarding as skipped
    // TODO: Re-enable when onboarding_responses table is created
    // await supabase
    //   .from('onboarding_responses')
    //   .insert({
    //     user_id: userId,
    //     question_id: 'onboarding_skipped',
    //     answer: { skipped: true },
    //     skipped: true,
    //     completed_at: new Date().toISOString()
    //   })

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
    // Map experience levels to existing tags
    const expLevelMap: Record<string, string[]> = {
      'beginner': ['beginner', 'beginner-friendly'],
      'intermediate': ['energy', 'focus'],
      'advanced': ['advanced'],
      'expert': ['advanced']
    }

    const possibleSlugs = expLevelMap[fullAnswers.experience_level] || [fullAnswers.experience_level]

    const { data: expTag } = await supabase
      .from('tags')
      .select('id')
      .in('slug', possibleSlugs)
      .limit(1)
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
    // Map interest areas to existing tags
    const interestMap: Record<string, string[]> = {
      'energy': ['energy', 'morning'],
      'focus': ['focus', 'breathing'],
      'fitness': ['exercise', 'cold-therapy'],
      'nutrition': ['nutrition'],
      'sleep': ['sleep'],
      'stress': ['breathing'],
      'productivity': ['focus', 'energy']
    }

    const allSlugs: string[] = []
    fullAnswers.interest_areas.forEach(interest => {
      const mapped = interestMap[interest] || [interest]
      allSlugs.push(...mapped)
    })

    const { data: interestTags } = await supabase
      .from('tags')
      .select('id, slug')
      .in('slug', [...new Set(allSlugs)]) // Remove duplicates

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

  // Mark user as onboarded in their profile
  await supabase
    .from('profiles')
    .update({ onboarded: true })
    .eq('id', userId)

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

  // TODO: Re-enable when onboarding_responses table is created
  // if (responses.length > 0) {
  //   await supabase
  //     .from('onboarding_responses')
  //     .upsert(responses)
  // }

  // Log the tag assignments for sync tracking
  // TODO: Re-enable when tag_sync_log table is created
  // for (const assignment of tagAssignments) {
  //   await supabase
  //     .from('tag_sync_log')
  //     .insert({
  //       user_id: userId,
  //       tag_id: assignment.tag_id,
  //       action: 'added',
  //       source: 'onboarding',
  //       target: 'web',
  //       new_value: { source: 'onboarding_completion' }
  //     })
  // }

  // Trigger Discord sync if user has Discord connected
  // TODO: Re-enable when Discord integration is added
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('discord_id')
  //   .eq('id', userId)
  //   .single()

  // if (profile?.discord_id && tagAssignments.length > 0) {
  //   // Fire and forget - don't wait for sync to complete
  //   fetch('/api/discord/sync', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       changes: tagAssignments.map(ta => ({
  //         tagId: ta.tag_id,
  //         action: 'add'
  //       }))
  //     })
  //   }).catch(err => console.error('Discord sync trigger failed:', err))
  // }
}