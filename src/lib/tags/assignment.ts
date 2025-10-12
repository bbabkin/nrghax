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

  // If user skipped onboarding, assign default beginner trait
  if ('skipped' in answers && answers.skipped) {
    // Mark user as onboarded with default beginner trait
    await supabase
      .from('profiles')
      .update({
        onboarded: true,
        traits: ['beginner']
      })
      .eq('id', userId)

    return
  }

  const fullAnswers = answers as OnboardingAnswers
  const traits: string[] = []

  // Map experience level to trait
  if (fullAnswers.experience_level) {
    const expLevelMap: Record<string, string> = {
      'beginner': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced',
      'expert': 'expert'
    }

    const trait = expLevelMap[fullAnswers.experience_level] || fullAnswers.experience_level
    traits.push(trait)
  }

  // Map interest areas to traits (can have multiple)
  if (fullAnswers.interest_areas && fullAnswers.interest_areas.length > 0) {
    const interestMap: Record<string, string[]> = {
      'energy': ['energy', 'morning'],
      'focus': ['focus', 'productivity'],
      'fitness': ['fitness', 'exercise'],
      'nutrition': ['nutrition', 'wellness'],
      'sleep': ['sleep', 'recovery'],
      'stress': ['stress-management', 'mindfulness'],
      'productivity': ['productivity', 'efficiency']
    }

    fullAnswers.interest_areas.forEach(interest => {
      const mapped = interestMap[interest] || [interest]
      traits.push(...mapped)
    })
  }

  // Map learning goals to traits
  if (fullAnswers.learning_goals && fullAnswers.learning_goals.length > 0) {
    fullAnswers.learning_goals.forEach(goal => {
      // Normalize goal to trait format (lowercase, hyphenated)
      const trait = goal.toLowerCase().replace(/\s+/g, '-')
      traits.push(trait)
    })
  }

  // Map time commitment to trait
  if (fullAnswers.time_commitment) {
    const timeMap: Record<string, string> = {
      'low': 'low-commitment',
      'medium': 'medium-commitment',
      'high': 'high-commitment',
      'flexible': 'flexible-schedule'
    }

    const trait = timeMap[fullAnswers.time_commitment] || fullAnswers.time_commitment
    traits.push(trait)
  }

  // Map difficulty preference to trait
  if (fullAnswers.preferred_difficulty) {
    const difficultyMap: Record<string, string> = {
      'easy': 'easy-mode',
      'medium': 'balanced-challenge',
      'hard': 'hard-mode',
      'varied': 'varied-difficulty'
    }

    const trait = difficultyMap[fullAnswers.preferred_difficulty] || fullAnswers.preferred_difficulty
    traits.push(trait)
  }

  // Remove duplicates and update profile
  const uniqueTraits = [...new Set(traits)]

  // Mark user as onboarded and assign traits
  await supabase
    .from('profiles')
    .update({
      onboarded: true,
      traits: uniqueTraits
    })
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

  // Trigger Discord sync if user has Discord connected
  // This will sync the traits as Discord roles
  // TODO: Re-enable when Discord integration is added
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('discord_id')
  //   .eq('id', userId)
  //   .single()

  // if (profile?.discord_id && uniqueTraits.length > 0) {
  //   // Fire and forget - don't wait for sync to complete
  //   fetch('/api/discord/sync-traits', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       userId,
  //       traits: uniqueTraits,
  //       action: 'sync'
  //     })
  //   }).catch(err => console.error('Discord sync trigger failed:', err))
  // }
}