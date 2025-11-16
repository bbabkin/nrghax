'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteRoutine } from '@/server/actions/routines'

interface DeleteRoutineButtonProps {
  routineId: string
  routineName: string
  variant?: 'large' | 'small'
}

export function DeleteRoutineButton({ routineId, routineName, variant = 'large' }: DeleteRoutineButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      await deleteRoutine(routineId)
    } catch (error) {
      console.error('Failed to delete routine:', error)
      alert('Failed to delete routine. Please try again.')
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  // Small variant for cards
  if (variant === 'small') {
    if (showConfirm) {
      return (
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-500/90 hover:bg-red-500 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center"
            style={{ width: '30px', height: '30px' }}
            title="Confirm delete"
          >
            <span className="text-sm font-bold">✓</span>
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
            className="bg-gray-700/90 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center"
            style={{ width: '30px', height: '30px' }}
            title="Cancel"
          >
            <span className="text-sm font-bold">✕</span>
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={handleDelete}
        className="bg-red-500/90 hover:bg-red-500 text-white rounded transition-colors flex items-center justify-center"
        style={{ width: '30px', height: '30px' }}
        title={`Delete ${routineName}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    )
  }

  // Large variant for admin pages
  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 px-3 py-2 bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
          style={{
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          }}
        >
          {isDeleting ? 'Deleting...' : 'Confirm?'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-3 py-2 bg-gray-700 text-white hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm"
          style={{
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
      style={{
        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
      }}
      title={`Delete ${routineName}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
