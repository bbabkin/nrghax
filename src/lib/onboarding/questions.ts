export type Question = {
  id: string
  title: string
  description: string
  type: 'single' | 'multiple'
  category: 'experience' | 'interests' | 'goals' | 'time' | 'difficulty'
  options: {
    value: string
    label: string
    description?: string
    icon?: string
  }[]
}

export const questions: Question[] = [
  {
    id: 'experience_level',
    title: "What's your experience with biohacking and optimization?",
    description: 'This helps us recommend hacks that match your current level.',
    type: 'single',
    category: 'experience',
    options: [
      {
        value: 'beginner',
        label: 'Beginner',
        description: 'New to biohacking, interested in getting started',
        icon: '🌱'
      },
      {
        value: 'intermediate',
        label: 'Intermediate',
        description: 'Some experience with basic hacks and routines',
        icon: '🚀'
      },
      {
        value: 'advanced',
        label: 'Advanced',
        description: 'Experienced biohacker with established routines',
        icon: '⭐'
      }
    ]
  },
  {
    id: 'interest_areas',
    title: 'Which areas do you want to optimize?',
    description: "Select all that apply. We'll recommend relevant hacks.",
    type: 'multiple',
    category: 'interests',
    options: [
      {
        value: 'energy',
        label: 'Energy & Vitality',
        description: 'Boost your daily energy levels',
        icon: '⚡'
      },
      {
        value: 'sleep',
        label: 'Sleep Quality',
        description: 'Improve sleep and recovery',
        icon: '😴'
      },
      {
        value: 'focus',
        label: 'Focus & Productivity',
        description: 'Enhance mental clarity and output',
        icon: '🎯'
      },
      {
        value: 'stress',
        label: 'Stress Management',
        description: 'Build resilience and calm',
        icon: '🧘'
      },
      {
        value: 'exercise',
        label: 'Fitness & Movement',
        description: 'Optimize physical performance',
        icon: '💪'
      },
      {
        value: 'nutrition',
        label: 'Nutrition',
        description: 'Optimize your diet and supplements',
        icon: '🥗'
      }
    ]
  },
  {
    id: 'learning_goals',
    title: 'What are your main goals?',
    description: 'This helps us understand what you want to achieve.',
    type: 'multiple',
    category: 'goals',
    options: [
      {
        value: 'productivity',
        label: 'Peak Performance',
        description: 'Maximize productivity and output',
        icon: '📈'
      },
      {
        value: 'health',
        label: 'Better Health',
        description: 'Improve overall health and wellbeing',
        icon: '❤️'
      },
      {
        value: 'confidence',
        label: 'Confidence & Social',
        description: 'Build confidence and social skills',
        icon: '💫'
      },
      {
        value: 'mindfulness',
        label: 'Mental Wellbeing',
        description: 'Develop mindfulness and awareness',
        icon: '🧠'
      }
    ]
  },
  {
    id: 'time_commitment',
    title: 'How much time can you dedicate to hacks?',
    description: "We'll recommend hacks that fit your schedule.",
    type: 'single',
    category: 'time',
    options: [
      {
        value: 'quick',
        label: 'Quick Wins',
        description: '5-10 minutes per day',
        icon: '⚡'
      },
      {
        value: 'moderate',
        label: 'Moderate',
        description: '15-30 minutes per day',
        icon: '🏃'
      },
      {
        value: 'dedicated',
        label: 'Dedicated',
        description: '30+ minutes per day',
        icon: '🔥'
      }
    ]
  },
  {
    id: 'preferred_difficulty',
    title: 'How do you prefer to start?',
    description: 'Choose your preferred approach.',
    type: 'single',
    category: 'difficulty',
    options: [
      {
        value: 'easy_start',
        label: 'Start Simple',
        description: 'Begin with easy hacks and build up',
        icon: '📈'
      },
      {
        value: 'challenging',
        label: 'Challenge Me',
        description: 'Jump into more advanced hacks',
        icon: '🎯'
      },
      {
        value: 'mixed',
        label: 'Mixed Approach',
        description: 'A balance of simple and advanced',
        icon: '⚖️'
      }
    ]
  }
]

// Function to get questions from database (async for client and server)
export async function getOnboardingQuestionsFromDB(): Promise<Question[]> {
  try {
    const response = await fetch('/api/admin/onboarding', {
      method: 'GET',
      cache: 'no-store'
    })

    if (response.ok) {
      const data = await response.json()
      if (data.questions && Array.isArray(data.questions)) {
        return data.questions
      }
    }
  } catch (error) {
    console.error('Failed to fetch custom questions from DB:', error)
  }

  return questions
}

// Function to get questions (can be overridden by admin settings)
// This is for client-side usage - returns default hardcoded questions synchronously
// For database questions, use getOnboardingQuestionsFromDB() instead
export function getOnboardingQuestions(): Question[] {
  return questions
}