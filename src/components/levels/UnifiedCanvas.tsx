'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomSkillsTree } from './CustomSkillsTree'
import { LibraryView } from '@/components/library/LibraryView'
import { LibrarySkillsNavCanvasSVG } from '@/components/navigation/LibrarySkillsNavCanvasSVG'
import { useScrollNavigation } from '@/hooks/useScrollNavigation'

interface UnifiedCanvasProps {
  skillsData: {
    hacks: any[]
    levelSlug: string
    levelName: string
  }
  libraryData: {
    hacks: any[]
    routines: any[]
  }
  isAuthenticated?: boolean
  user?: {
    name?: string
    email?: string
    image?: string
  }
  initialView?: 'skills' | 'library'
}

export function UnifiedCanvas({
  skillsData,
  libraryData,
  isAuthenticated = false,
  user,
  initialView = 'skills'
}: UnifiedCanvasProps) {
  const [currentView, setCurrentView] = useState<'skills' | 'library'>(initialView)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isAtEdge, setIsAtEdge] = useState(true) // Track if we're at an edge position
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const isInitialMount = useRef(true)

  // Refs for scroll detection
  const skillsSectionRef = useRef<HTMLDivElement>(null)
  const librarySectionRef = useRef<HTMLDivElement>(null)

  // Handle initial mount - don't animate on first load or when returning from modal
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      // Check if returning from modal
      if (typeof window !== 'undefined') {
        const returnPage = sessionStorage.getItem('returnToPage')
        if (returnPage === 'library' || returnPage === 'skills') {
          // Don't animate when returning from modal
          setShouldAnimate(false)
        }
      }
    }
  }, [])

  // Hide navbar and footer by adding a class to body
  useEffect(() => {
    // Add class to body to hide navbar/footer
    document.body.classList.add('hide-nav-footer')

    return () => {
      // Remove class when unmounting
      document.body.classList.remove('hide-nav-footer')
    }
  }, [])

  const handleViewChange = (view: 'skills' | 'library') => {
    if (view === currentView || isAnimating) return

    // Enable animation for user-initiated navigation
    setShouldAnimate(true)
    setIsAnimating(true)
    setCurrentView(view)

    // Reset animation flag after animation completes
    setTimeout(() => {
      setIsAnimating(false)
    }, 1000)
  }

  // Handle scroll-based navigation
  const handleScrollNavigation = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentView === 'skills') {
      handleViewChange('library')
    } else if (direction === 'up' && currentView === 'library') {
      handleViewChange('skills')
    }
  }

  // Initialize scroll navigation hook
  const {
    progress,
    direction,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useScrollNavigation({
    threshold: 400, // 400px of scrolling to trigger navigation
    onNavigate: handleScrollNavigation,
    isEnabled: isAtEdge, // Only enable when at edge positions
    currentView,
    isAnimating,
  })

  // Monitor Library scroll position to detect top edge
  useEffect(() => {
    const librarySection = librarySectionRef.current
    if (!librarySection) return

    const handleLibraryScroll = () => {
      const isAtTop = librarySection.scrollTop <= 5 // Small threshold for edge detection
      setIsAtEdge(currentView === 'library' ? isAtTop : true)
    }

    librarySection.addEventListener('scroll', handleLibraryScroll)
    handleLibraryScroll() // Check initial state

    return () => {
      librarySection.removeEventListener('scroll', handleLibraryScroll)
    }
  }, [currentView])

  // Attach wheel event listeners to Skills section
  useEffect(() => {
    const skillsSection = skillsSectionRef.current
    if (!skillsSection) return

    skillsSection.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      skillsSection.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Attach wheel event listeners to Library section (for scrolling up when at top)
  useEffect(() => {
    const librarySection = librarySectionRef.current
    if (!librarySection) return

    librarySection.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      librarySection.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Attach touch event listeners for mobile gestures
  useEffect(() => {
    const skillsSection = skillsSectionRef.current
    const librarySection = librarySectionRef.current

    if (skillsSection) {
      skillsSection.addEventListener('touchstart', handleTouchStart, { passive: true })
      skillsSection.addEventListener('touchmove', handleTouchMove, { passive: true })
      skillsSection.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    if (librarySection) {
      librarySection.addEventListener('touchstart', handleTouchStart, { passive: true })
      librarySection.addEventListener('touchmove', handleTouchMove, { passive: true })
      librarySection.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    return () => {
      if (skillsSection) {
        skillsSection.removeEventListener('touchstart', handleTouchStart)
        skillsSection.removeEventListener('touchmove', handleTouchMove)
        skillsSection.removeEventListener('touchend', handleTouchEnd)
      }
      if (librarySection) {
        librarySection.removeEventListener('touchstart', handleTouchStart)
        librarySection.removeEventListener('touchmove', handleTouchMove)
        librarySection.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Giant canvas container - animates only on user navigation */}
      <motion.div
        className="relative w-full h-[200vh]"
        initial={false}
        animate={{
          y: currentView === 'library' ? 'calc(-100vh + 80px)' : 0
        }}
        transition={
          shouldAnimate
            ? {
                type: "tween",
                ease: "easeInOut",
                duration: 0.6
              }
            : { duration: 0 }
        }
      >
        {/* Skills Section (Top Half) */}
        <div ref={skillsSectionRef} className="h-screen relative overflow-hidden">
          <CustomSkillsTree
            hacks={skillsData.hacks}
            levelSlug={skillsData.levelSlug}
            levelName={skillsData.levelName}
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* Navigation Bar (Middle) - This moves with the canvas, NOT fixed */}
        <div className="absolute top-[calc(100vh-80px)] left-0 right-0 z-50">
          <LibrarySkillsNavCanvasSVG
            currentView={currentView}
            onViewChange={handleViewChange}
            disabled={isAnimating}
            isAuthenticated={isAuthenticated}
            user={user}
            scrollProgress={progress}
            scrollDirection={direction}
          />
        </div>

        {/* Library Section (Bottom Half) */}
        <div ref={librarySectionRef} className="h-screen relative overflow-y-auto">
          <LibraryView
            hacks={libraryData.hacks}
            routines={libraryData.routines}
            isAuthenticated={isAuthenticated}
            scrollContainerRef={librarySectionRef}
          />
        </div>
      </motion.div>


      {/* Visual indicators during animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[60]"
          >
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, ease: "linear" }}
                className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400"
                style={{ borderRadius: '50%' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}