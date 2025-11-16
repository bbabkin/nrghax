'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface OnboardingAnswers {
  experience_level?: string
  interest_areas?: string[]
  learning_goals?: string[]
  time_commitment?: string
  preferred_difficulty?: string
  skipped?: boolean
}

export async function completeOnboarding(
  userId: string,
  answers: OnboardingAnswers | { skipped: boolean }
) {
  const supabase = await createClient()

  // If user skipped onboarding, assign default beginner trait
  if ('skipped' in answers && answers.skipped) {
    console.log('Skipping onboarding for user:', userId)

    // Try with traits first, fallback to just onboarded if traits column doesn't exist
    let { data, error: skipError } = await supabase
      .from('profiles')
      .update({
        onboarded: true,
        traits: ['beginner']
      })
      .eq('id', userId)
      .select()

    // If traits column doesn't exist, just update onboarded flag
    if (skipError && skipError.message?.includes('column') && skipError.message?.includes('traits')) {
      console.log('Traits column not found, updating onboarded only')
      const fallbackResult = await supabase
        .from('profiles')
        .update({
          onboarded: true
        })
        .eq('id', userId)
        .select()

      data = fallbackResult.data
      skipError = fallbackResult.error
    }

    if (skipError) {
      console.error('Error updating profile (skip):', skipError)
      throw new Error('Failed to update profile: ' + skipError.message)
    }

    console.log('Profile updated (skip):', data)

    // Revalidate paths to clear cache
    revalidatePath('/onboarding')
    revalidatePath('/library')
    revalidatePath('/', 'layout')

    return { success: true }
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

  console.log('Updating profile for user:', userId, 'with traits:', uniqueTraits)

  // Try with traits first, fallback to just onboarded if traits column doesn't exist
  let { data, error: updateError } = await supabase
    .from('profiles')
    .update({
      onboarded: true,
      traits: uniqueTraits
    })
    .eq('id', userId)
    .select()

  // If traits column doesn't exist, just update onboarded flag
  if (updateError && updateError.message?.includes('column') && updateError.message?.includes('traits')) {
    console.log('Traits column not found, updating onboarded only')
    const fallbackResult = await supabase
      .from('profiles')
      .update({
        onboarded: true
      })
      .eq('id', userId)
      .select()

    data = fallbackResult.data
    updateError = fallbackResult.error
  }

  if (updateError) {
    console.error('Error updating profile:', updateError)
    throw new Error('Failed to update profile: ' + updateError.message)
  }

  console.log('Profile updated successfully:', data)

  // Revalidate paths to clear cache
  revalidatePath('/onboarding')
  revalidatePath('/library')
  revalidatePath('/', 'layout')

  return { success: true }
}
