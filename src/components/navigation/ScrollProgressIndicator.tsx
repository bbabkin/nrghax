'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface ScrollProgressIndicatorProps {
  progress: number // 0-100
  direction: 'up' | 'down'
  show: boolean
}

export function ScrollProgressIndicator({
  progress,
  direction,
  show,
}: ScrollProgressIndicatorProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Calculate vertical movement based on progress (max 20px movement)
  const verticalOffset = direction === 'down'
    ? (progress / 100) * 20  // Move down
    : -(progress / 100) * 20 // Move up

  // Position arrows overlaid on tabs using percentages
  // Desktop: 60% offset from center (20% and 80% from left)
  // Mobile: 80% offset from center (10% and 90% from left)
  const horizontalPosition = direction === 'down'
    ? (isMobile ? '10%' : '20%')  // Down arrow (Library) - left side
    : (isMobile ? '90%' : '80%')  // Up arrow (Skills) - right side

  // Vertical position depends on direction
  // Down arrow: navbar at bottom (Skills view) - shifted up 20px
  // Up arrow: navbar at top (Library view) - positioned at top
  const verticalPosition = direction === 'down'
    ? 'calc(100vh - 60px)'  // Bottom navbar, shifted up by 20px
    : '40px'                 // Top navbar (library view)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: '-50%' }}
          animate={{ opacity: 1, x: '-50%', y: verticalOffset }}
          exit={{ opacity: 0, x: '-50%' }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          className="fixed z-[55] pointer-events-none"
          style={{
            top: verticalPosition,
            left: horizontalPosition,
          }}
        >
          {/* Three arrows side by side for better visibility */}
          <div className="flex flex-row items-center gap-1">
            {[0, 1, 2].map((index) => (
              <svg
                key={index}
                width="14"
                height="20"
                viewBox="0 0 14 20"
                className={direction === 'down' ? '' : 'rotate-180'}
                style={{
                  opacity: 1 - (index * 0.25) // Fade effect: 1, 0.75, 0.5
                }}
              >
                <polygon
                  points="3.3,10.5 0.1,10.5 6.5,20 12.8,10.5 9.6,10.5 9.6,0.9 3.3,0.9"
                  fill="#FFBB00"
                />
              </svg>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
