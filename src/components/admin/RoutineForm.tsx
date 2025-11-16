'use client'

import { useState, useEffect } from 'react'
import { Save, ArrowLeft } from 'lucide-react'
import { createRoutine, updateRoutine, generateSlug } from '@/server/actions/routines'
import { useRouter } from 'next/navigation'

interface Routine {
  id?: string
  name: string
  slug: string
  description: string
  duration_minutes: number | null
  image_url: string | null
  is_public: boolean
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface RoutineFormProps {
  routine?: Routine
  tags: Tag[]
  selectedTagIds?: string[]
}

export function RoutineForm({ routine, tags, selectedTagIds = [] }: RoutineFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: routine?.name || '',
    slug: routine?.slug || '',
    description: routine?.description || '',
    duration_minutes: routine?.duration_minutes?.toString() || '',
    image_url: routine?.image_url || '',
    is_public: routine?.is_public || false,
  })
  const [selectedTags, setSelectedTags] = useState<string[]>(selectedTagIds)

  // Auto-generate slug from name
  const handleNameChange = async (name: string) => {
    setFormData(prev => ({ ...prev, name }))
    if (!routine) {
      // Only auto-generate slug for new routines
      const slug = await generateSlug(name)
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('slug', formData.slug)
      formDataObj.append('description', formData.description)
      if (formData.duration_minutes) {
        formDataObj.append('duration_minutes', formData.duration_minutes)
      }
      if (formData.image_url) {
        formDataObj.append('image_url', formData.image_url)
      }
      formDataObj.append('is_public', formData.is_public.toString())

      // Add selected tags
      selectedTags.forEach(tagId => {
        formDataObj.append('tag_ids[]', tagId)
      })

      if (routine?.id) {
        await updateRoutine(routine.id, formDataObj)
      } else {
        await createRoutine(formDataObj)
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save routine')
      setIsSubmitting(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-4"
          style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          }}
        >
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-yellow-400 font-semibold mb-2">
          Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          className="w-full bg-gray-800 border-2 border-yellow-400/30 text-white px-4 py-3 focus:outline-none focus:border-yellow-400 transition-colors"
          style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          }}
          placeholder="Enter routine name"
        />
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-yellow-400 font-semibold mb-2">
          Slug *
        </label>
        <input
          type="text"
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
          required
          className="w-full bg-gray-800 border-2 border-yellow-400/30 text-white px-4 py-3 focus:outline-none focus:border-yellow-400 transition-colors"
          style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          }}
          placeholder="routine-slug"
        />
        <p className="text-gray-500 text-sm mt-1">
          URL-friendly identifier (auto-generated from name)
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-yellow-400 font-semibold mb-2">
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
          rows={4}
          className="w-full bg-gray-800 border-2 border-yellow-400/30 text-white px-4 py-3 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
          style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          }}
          placeholder="Describe this routine"
        />
      </div>

      {/* Duration */}
      <div>
        <label htmlFor="duration_minutes" className="block text-yellow-400 font-semibold mb-2">
          Duration (minutes)
        </label>
        <input
          type="number"
          id="duration_minutes"
          value={formData.duration_minutes}
          onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
          min="1"
          className="w-full bg-gray-800 border-2 border-yellow-400/30 text-white px-4 py-3 focus:outline-none focus:border-yellow-400 transition-colors"
          style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          }}
          placeholder="30"
        />
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="image_url" className="block text-yellow-400 font-semibold mb-2">
          Image URL
        </label>
        <input
          type="url"
          id="image_url"
          value={formData.image_url}
          onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
          className="w-full bg-gray-800 border-2 border-yellow-400/30 text-white px-4 py-3 focus:outline-none focus:border-yellow-400 transition-colors"
          style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          }}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      {/* Public Checkbox */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_public"
          checked={formData.is_public}
          onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
          className="w-5 h-5 bg-gray-800 border-2 border-yellow-400/30 text-yellow-400 focus:ring-2 focus:ring-yellow-400"
        />
        <label htmlFor="is_public" className="text-white font-semibold">
          Make this routine public
        </label>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-yellow-400 font-semibold mb-3">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-4 py-2 border-2 transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-gray-800 text-yellow-400 border-yellow-400/30 hover:border-yellow-400/60'
              }`}
              style={{
                clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t border-gray-700">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors disabled:opacity-50"
          style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          }}
        >
          <ArrowLeft className="h-5 w-5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50"
          style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
          }}
        >
          <Save className="h-5 w-5" />
          {isSubmitting ? 'Saving...' : routine ? 'Update Routine' : 'Create Routine'}
        </button>
      </div>
    </form>
  )
}
