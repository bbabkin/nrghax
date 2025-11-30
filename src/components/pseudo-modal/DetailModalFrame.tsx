'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useCallback, useRef } from 'react'

interface DetailModalFrameProps {
  children: React.ReactNode
}

export function DetailModalFrame({ children }: DetailModalFrameProps) {
  const router = useRouter()
  const hasNavigated = useRef(false)

  const handleClose = useCallback(() => {
    if (hasNavigated.current) return
    hasNavigated.current = true

    const navigate = () => {
      // Check if we have history to go back to
      if (window.history.length > 2) {
        router.back()
      } else {
        // Fallback for direct links
        router.push('/library')
      }
    }

    // Use View Transitions API if available (Chrome/Edge)
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        navigate()
      })
    } else {
      navigate()
    }
  }, [router])

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [handleClose])

  // Click outside handler (backdrop click)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
      style={{ viewTransitionName: 'backdrop' }}
    >
      <div
        className="relative w-full max-w-5xl h-[85vh] bg-white overflow-hidden rounded-lg"
        style={{
          viewTransitionName: 'detail-modal',
          boxShadow: '0 0 50px rgba(128, 128, 128, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
