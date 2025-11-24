'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { HackModalEnhanced } from '@/components/levels/HackModalEnhanced'

interface HackModalWrapperProps {
  hack: any
  levelSlug: string
  allLevelHacks: any[]
}

export function HackModalWrapper({ hack, levelSlug, allLevelHacks }: HackModalWrapperProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => router.back(), 200)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            aria-label="Close modal"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none z-[201]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                duration: 0.3,
                type: "spring",
                damping: 30,
                stiffness: 300
              }}
              className="relative w-full max-w-[1200px] h-[90vh] max-h-[800px] bg-gray-900 rounded-lg shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-800/50 rounded-lg transition-colors z-[10]"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>

              {/* Hack Content */}
              <div className="h-full overflow-y-auto">
                <HackModalEnhanced
                  hack={hack}
                  levelSlug={levelSlug}
                  allLevelHacks={allLevelHacks}
                  returnPath="/library"
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}