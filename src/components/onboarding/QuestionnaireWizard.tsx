'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { assignTagsFromOnboarding } from '@/lib/tags/assignment'
import { getOnboardingQuestions, type Question } from '@/lib/onboarding/questions'
import { cn } from '@/lib/utils'

interface Props {
  userId: string
}

export default function QuestionnaireWizard({ userId }: Props) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load questions (including any admin customizations)
    setQuestions(getOnboardingQuestions())
  }, [])

  // Return loading state if questions not loaded yet
  if (questions.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  const handleSingleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
    // Auto-advance after a short delay for single choice questions
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }, 300)
  }

  const handleMultipleAnswer = (value: string, checked: boolean) => {
    setAnswers(prev => {
      const current = (prev[currentQuestion.id] as string[]) || []
      if (checked) {
        return { ...prev, [currentQuestion.id]: [...current, value] }
      } else {
        return { ...prev, [currentQuestion.id]: current.filter(v => v !== value) }
      }
    })
  }

  const canProceed = () => {
    const answer = answers[currentQuestion.id]
    if (currentQuestion.type === 'single') {
      return !!answer
    } else {
      return Array.isArray(answer) && answer.length > 0
    }
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Assign default beginner tag when skipping
      await assignTagsFromOnboarding(userId, { skipped: true })
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to skip onboarding. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await assignTagsFromOnboarding(userId, answers)
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to save your preferences. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
        </div>
        <CardTitle className="flex items-center gap-2">
          {currentQuestion.title}
        </CardTitle>
        <CardDescription>{currentQuestion.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {currentQuestion.type === 'single' ? (
          <RadioGroup
            value={answers[currentQuestion.id] as string}
            onValueChange={handleSingleAnswer}
            className="space-y-3"
          >
            {currentQuestion.options.map(option => (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    "hover:bg-muted/50",
                    "peer-checked:border-primary peer-checked:bg-primary/5"
                  )}
                >
                  {option.icon && <span className="text-2xl">{option.icon}</span>}
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-3">
            {currentQuestion.options.map(option => {
              const isChecked = (answers[currentQuestion.id] as string[] || []).includes(option.value)
              return (
                <div key={option.value} className="relative">
                  <Checkbox
                    id={option.value}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleMultipleAnswer(option.value, checked as boolean)}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      "hover:bg-muted/50",
                      isChecked && "border-primary bg-primary/5"
                    )}
                  >
                    {option.icon && <span className="text-2xl">{option.icon}</span>}
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {isChecked && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </Label>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <div className="flex justify-between w-full">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentQuestion.type === 'multiple' && (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === questions.length - 1 ? (
                <>
                  Complete
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          Skip onboarding questions
        </button>
      </CardFooter>
    </Card>
  )
}