'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export function CloseButton() {
  const router = useRouter()
  const hasNavigated = useRef(false)

  const handleClose = () => {
    if (hasNavigated.current) return
    hasNavigated.current = true

    const navigate = () => {
      if (window.history.length > 2) {
        router.back()
      } else {
        router.push('/library')
      }
    }

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        navigate()
      })
    } else {
      navigate()
    }
  }

  return (
    <button
      onClick={handleClose}
      className="absolute top-4 right-4 z-20 w-10 h-10 bg-yellow-400 hover:bg-yellow-500 transition-colors flex items-center justify-center"
      style={{
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
      }}
      aria-label="Close"
    >
      <X className="h-6 w-6 text-black" />
    </button>
  )
}
