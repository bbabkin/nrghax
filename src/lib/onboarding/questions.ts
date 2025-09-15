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
    title: "What's your experience level with cybersecurity?",
    description: 'This helps us recommend challenges that match your current skills.',
    type: 'single',
    category: 'experience',
    options: [
      {
        value: 'beginner',
        label: 'Beginner',
        description: 'New to cybersecurity, learning the basics',
        icon: '🌱'
      },
      {
        value: 'intermediate',
        label: 'Intermediate',
        description: 'Some experience with security concepts and tools',
        icon: '🚀'
      },
      {
        value: 'expert',
        label: 'Expert',
        description: 'Advanced knowledge and practical experience',
        icon: '⭐'
      }
    ]
  },
  {
    id: 'interest_areas',
    title: 'Which areas interest you the most?',
    description: "Select all that apply. We'll recommend relevant challenges.",
    type: 'multiple',
    category: 'interests',
    options: [
      {
        value: 'web-security',
        label: 'Web Security',
        description: 'XSS, SQL injection, CSRF, etc.',
        icon: '🌐'
      },
      {
        value: 'binary-exploitation',
        label: 'Binary Exploitation',
        description: 'Buffer overflows, ROP chains, reverse engineering',
        icon: '💾'
      },
      {
        value: 'cryptography',
        label: 'Cryptography',
        description: 'Encryption, hashing, cryptanalysis',
        icon: '🔐'
      },
      {
        value: 'network-security',
        label: 'Network Security',
        description: 'Protocols, packet analysis, pentesting',
        icon: '🔌'
      },
      {
        value: 'cloud-security',
        label: 'Cloud Security',
        description: 'Cloud infrastructure, containers, Kubernetes',
        icon: '☁️'
      },
      {
        value: 'mobile-security',
        label: 'Mobile Security',
        description: 'Android/iOS security, mobile app pentesting',
        icon: '📱'
      }
    ]
  },
  {
    id: 'learning_goals',
    title: 'What are your main learning goals?',
    description: 'This helps us understand what you want to achieve.',
    type: 'multiple',
    category: 'goals',
    options: [
      {
        value: 'ctf-prep',
        label: 'CTF Preparation',
        description: 'Prepare for Capture The Flag competitions',
        icon: '🏁'
      },
      {
        value: 'bug-bounty',
        label: 'Bug Bounty',
        description: 'Learn skills for bug bounty hunting',
        icon: '🐛'
      },
      {
        value: 'professional',
        label: 'Professional Development',
        description: 'Advance my cybersecurity career',
        icon: '💼'
      },
      {
        value: 'hobby',
        label: 'Personal Interest',
        description: 'Learning for fun and curiosity',
        icon: '🎯'
      }
    ]
  },
  {
    id: 'time_commitment',
    title: 'How much time can you dedicate to learning?',
    description: "We'll recommend challenges that fit your schedule.",
    type: 'single',
    category: 'time',
    options: [
      {
        value: 'casual',
        label: 'Casual',
        description: 'A few hours per week',
        icon: '🐢'
      },
      {
        value: 'regular',
        label: 'Regular',
        description: '1-2 hours daily',
        icon: '🏃'
      },
      {
        value: 'intensive',
        label: 'Intensive',
        description: 'Several hours daily',
        icon: '🔥'
      }
    ]
  },
  {
    id: 'preferred_difficulty',
    title: 'How do you prefer to learn?',
    description: 'Choose your preferred difficulty progression.',
    type: 'single',
    category: 'difficulty',
    options: [
      {
        value: 'easy_start',
        label: 'Start Easy',
        description: 'Begin with simple challenges and gradually increase difficulty',
        icon: '📈'
      },
      {
        value: 'challenging',
        label: 'Jump into Challenges',
        description: 'Prefer challenging problems from the start',
        icon: '⚡'
      },
      {
        value: 'mixed',
        label: 'Mixed Approach',
        description: 'A balance of easy and difficult challenges',
        icon: '⚖️'
      }
    ]
  }
]

// Function to get questions (can be overridden by admin settings)
export function getOnboardingQuestions(): Question[] {
  // Check if admin has customized questions
  if (typeof window !== 'undefined') {
    const customQuestions = localStorage.getItem('onboarding_questions')
    if (customQuestions) {
      try {
        return JSON.parse(customQuestions)
      } catch (e) {
        console.error('Failed to parse custom questions:', e)
      }
    }
  }
  return questions
}