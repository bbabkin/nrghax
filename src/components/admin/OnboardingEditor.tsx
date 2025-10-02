'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Save, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

// Import the questions from the wizard (we'll make this configurable)
import { questions as defaultQuestions, type Question } from '@/lib/onboarding/questions'

interface OnboardingEditorProps {
  experienceTags: any[]
  interestTags: any[]
  initialQuestions?: Question[]
}

export default function OnboardingEditor({ experienceTags, interestTags, initialQuestions }: OnboardingEditorProps) {
  const [questions, setQuestions] = useState(initialQuestions || defaultQuestions)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleQuestionEdit = (questionId: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, [field]: value } : q
    ))
  }

  const handleOptionEdit = (questionId: string, optionIndex: number, field: string, value: any) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options]
        newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value }
        return { ...q, options: newOptions }
      }
      return q
    }))
  }

  const handleAddOption = (questionId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: [...q.options, {
            value: `option-${Date.now()}`,
            label: 'New Option',
            description: '',
            icon: '🆕'
          }]
        }
      }
      return q
    }))
  }

  const handleDeleteOption = (questionId: string, optionIndex: number) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.filter((_, i) => i !== optionIndex)
        }
      }
      return q
    }))
  }

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < questions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]]
      setQuestions(newQuestions)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to database via API
      const response = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
      })

      const data = await response.json()

      if (response.ok) {
        // Also save to localStorage as fallback
        localStorage.setItem('onboarding_questions', JSON.stringify(questions))

        toast({
          title: 'Success!',
          description: 'Onboarding questions have been saved to the database'
        })
      } else {
        throw new Error(data.error || 'Failed to save questions')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save questions. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Question Configuration</CardTitle>
          <CardDescription>
            Drag to reorder, click to edit questions and options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="questions">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="tags">Available Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingQuestion === question.id ? (
                          <div className="space-y-3">
                            <Input
                              value={question.title}
                              onChange={(e) => handleQuestionEdit(question.id, 'title', e.target.value)}
                              className="text-lg font-semibold bg-background text-foreground"
                            />
                            <Textarea
                              value={question.description}
                              onChange={(e) => handleQuestionEdit(question.id, 'description', e.target.value)}
                              rows={2}
                              className="bg-background text-foreground"
                            />
                            <div className="flex gap-2">
                              <Select
                                value={question.type}
                                onValueChange={(value) => handleQuestionEdit(question.id, 'type', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single">Single Choice</SelectItem>
                                  <SelectItem value="multiple">Multiple Choice</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={question.category}
                                onValueChange={(value) => handleQuestionEdit(question.id, 'category', value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="experience">Experience</SelectItem>
                                  <SelectItem value="interests">Interests</SelectItem>
                                  <SelectItem value="goals">Goals</SelectItem>
                                  <SelectItem value="time">Time</SelectItem>
                                  <SelectItem value="difficulty">Difficulty</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : (
                          <>
                            <CardTitle className="text-lg">
                              Question {index + 1}: {question.title}
                            </CardTitle>
                            <CardDescription>{question.description}</CardDescription>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{question.type}</Badge>
                              <Badge variant="secondary">{question.category}</Badge>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveQuestion(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveQuestion(index, 'down')}
                          disabled={index === questions.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingQuestion(
                            editingQuestion === question.id ? null : question.id
                          )}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2 p-2 border rounded">
                          {editingQuestion === question.id ? (
                            <>
                              <Input
                                value={option.icon || ''}
                                onChange={(e) => handleOptionEdit(question.id, optionIndex, 'icon', e.target.value)}
                                className="w-16 bg-background text-foreground"
                                placeholder="Icon"
                              />
                              <Input
                                value={option.value}
                                onChange={(e) => handleOptionEdit(question.id, optionIndex, 'value', e.target.value)}
                                className="w-32 bg-background text-foreground"
                                placeholder="Value"
                              />
                              <Input
                                value={option.label}
                                onChange={(e) => handleOptionEdit(question.id, optionIndex, 'label', e.target.value)}
                                className="flex-1 bg-background text-foreground"
                                placeholder="Label"
                              />
                              <Input
                                value={option.description || ''}
                                onChange={(e) => handleOptionEdit(question.id, optionIndex, 'description', e.target.value)}
                                className="flex-1 bg-background text-foreground"
                                placeholder="Description"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteOption(question.id, optionIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl">{option.icon}</span>
                              <div className="flex-1">
                                <div className="font-medium">{option.label}</div>
                                {option.description && (
                                  <div className="text-sm text-muted-foreground">{option.description}</div>
                                )}
                              </div>
                              <Badge variant="outline">{option.value}</Badge>
                            </>
                          )}
                        </div>
                      ))}
                      {editingQuestion === question.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(question.id)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Experience Tags</CardTitle>
                  <CardDescription>
                    These tags are mutually exclusive - users can only have one
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {experienceTags.map(tag => (
                      <Badge key={tag.id} variant="default">
                        {tag.name} ({tag.slug})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interest Tags</CardTitle>
                  <CardDescription>
                    Users can have multiple interest tags
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {interestTags.map(tag => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name} ({tag.slug})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}