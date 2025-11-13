'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
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
  const router = useRouter()
  const pathname = usePathname()
  const [currentView, setCurrentView] = useState<'skills' | 'library'>(initialView)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isAtEdge, setIsAtEdge] = useState(false) // Track if we're at an edge position - start false to prevent immediate transition
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const isInitialMount = useRef(true)

  // Refs for scroll detection
  const skillsSectionRef = useRef<HTMLDivElement>(null)
  const librarySectionRef = useRef<HTMLDivElement>(null)

  // Refs for edge dwell time tracking
  const edgeReachedTimeRef = useRef<number>(0)
  const edgeDwellTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const EDGE_TOLERANCE = 20 // Increased from 5px for better reliability
  const EDGE_DWELL_TIME = 200 // Must be at edge for 200ms before enabling transition

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

      // Removed - consolidated below
    }
  }, [])

  // Scroll to bottom when on skills view (initial load and after transitions)
  useEffect(() => {
    if (currentView === 'skills') {
      // Wait for animation to complete and content to render
      const delay = isAnimating ? 800 : 300
      const timer = setTimeout(() => {
        const skillsSection = skillsSectionRef.current
        if (skillsSection) {
          // Scroll to bottom - skills tree grows upward
          skillsSection.scrollTop = skillsSection.scrollHeight

          // Double-check after a brief moment in case content is still loading
          setTimeout(() => {
            if (skillsSection.scrollTop === 0) {
              skillsSection.scrollTop = skillsSection.scrollHeight
            }
          }, 100)
        }
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [currentView, isAnimating])

  // Hide navbar and footer by adding a class to body
  useEffect(() => {
    // Add class to body to hide navbar/footer
    document.body.classList.add('hide-nav-footer')

    return () => {
      // Remove class when unmounting
      document.body.classList.remove('hide-nav-footer')
    }
  }, [])

  // Sync view with URL when using browser navigation
  useEffect(() => {
    const expectedView = pathname === '/skills' ? 'skills' : 'library'
    if (currentView !== expectedView && !isAnimating) {
      setShouldAnimate(true)
      setCurrentView(expectedView)
    }
  }, [pathname, currentView, isAnimating])

  const handleViewChange = (view: 'skills' | 'library') => {
    if (view === currentView || isAnimating) return

    // Enable animation for user-initiated navigation
    setShouldAnimate(true)
    setIsAnimating(true)
    setCurrentView(view)

    // Update URL to match the new view
    if (typeof window !== 'undefined') {
      const newPath = view === 'skills' ? '/skills' : '/library'
      if (pathname !== newPath) {
        router.push(newPath)
      }
    }

    // Reset animation flag after animation completes
    setTimeout(() => {
      setIsAnimating(false)
      // The scroll positioning is handled by the useEffect that watches currentView
    }, 700) // Slightly after animation completes
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
    showIndicator,
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

  // Monitor scroll positions to detect edges with dwell time
  useEffect(() => {
    const skillsSection = skillsSectionRef.current
    const librarySection = librarySectionRef.current

    const checkScrollEdges = () => {
      let currentlyAtEdge = false

      if (currentView === 'skills' && skillsSection) {
        // Check if at bottom of skills section
        const scrollBottom = skillsSection.scrollHeight - skillsSection.scrollTop - skillsSection.clientHeight
        currentlyAtEdge = scrollBottom <= EDGE_TOLERANCE
      } else if (currentView === 'library' && librarySection) {
        // Check if at top of library section
        currentlyAtEdge = librarySection.scrollTop <= EDGE_TOLERANCE
      }

      // Handle edge state with dwell time
      if (currentlyAtEdge) {
        // If we just reached the edge, start tracking dwell time
        if (!edgeReachedTimeRef.current) {
          edgeReachedTimeRef.current = Date.now()

          // Clear any existing timeout
          if (edgeDwellTimeoutRef.current) {
            clearTimeout(edgeDwellTimeoutRef.current)
          }

          // Set timeout to enable edge after dwell time
          edgeDwellTimeoutRef.current = setTimeout(() => {
            // Verify we're still at edge before enabling
            let stillAtEdge = false
            if (currentView === 'skills' && skillsSection) {
              const scrollBottom = skillsSection.scrollHeight - skillsSection.scrollTop - skillsSection.clientHeight
              stillAtEdge = scrollBottom <= EDGE_TOLERANCE
            } else if (currentView === 'library' && librarySection) {
              stillAtEdge = librarySection.scrollTop <= EDGE_TOLERANCE
            }

            if (stillAtEdge) {
              setIsAtEdge(true)
            }
          }, EDGE_DWELL_TIME)
        }
      } else {
        // Not at edge anymore - immediately disable and reset
        if (edgeDwellTimeoutRef.current) {
          clearTimeout(edgeDwellTimeoutRef.current)
          edgeDwellTimeoutRef.current = null
        }
        edgeReachedTimeRef.current = 0
        setIsAtEdge(false)
      }
    }

    const handleSkillsScroll = () => {
      if (currentView === 'skills') checkScrollEdges()
    }

    const handleLibraryScroll = () => {
      if (currentView === 'library') checkScrollEdges()
    }

    if (skillsSection) {
      skillsSection.addEventListener('scroll', handleSkillsScroll, { passive: true })
      // Check immediately after attaching with longer delay for stability
      setTimeout(checkScrollEdges, 300)
    }

    if (librarySection) {
      librarySection.addEventListener('scroll', handleLibraryScroll, { passive: true })
    }

    return () => {
      if (skillsSection) {
        skillsSection.removeEventListener('scroll', handleSkillsScroll)
      }
      if (librarySection) {
        librarySection.removeEventListener('scroll', handleLibraryScroll)
      }
      // Clear timeout on cleanup
      if (edgeDwellTimeoutRef.current) {
        clearTimeout(edgeDwellTimeoutRef.current)
      }
    }
  }, [currentView])

  // Simplified wheel handler - rely on isAtEdge state with dwell time
  const handleWheelWithEdgeCheck = useCallback((event: WheelEvent) => {
    // Only process if we're at edge (with dwell time requirement met)
    // and scrolling in the correct direction
    if (!isAtEdge) return

    if (currentView === 'skills' && event.deltaY < 0) {
      // On skills page but scrolling up - ignore
      return
    } else if (currentView === 'library' && event.deltaY > 0) {
      // On library page but scrolling down - ignore
      return
    }

    // We're at edge and scrolling in correct direction
    handleWheel(event)
  }, [currentView, isAtEdge, handleWheel])

  // Attach wheel event listeners
  useEffect(() => {
    const skillsSection = skillsSectionRef.current
    const librarySection = librarySectionRef.current

    if (currentView === 'skills' && skillsSection) {
      skillsSection.addEventListener('wheel', handleWheelWithEdgeCheck, { passive: false })

      return () => {
        skillsSection.removeEventListener('wheel', handleWheelWithEdgeCheck)
      }
    }

    if (currentView === 'library' && librarySection) {
      librarySection.addEventListener('wheel', handleWheelWithEdgeCheck, { passive: false })

      return () => {
        librarySection.removeEventListener('wheel', handleWheelWithEdgeCheck)
      }
    }
  }, [handleWheelWithEdgeCheck, currentView])

  // Simplified touch handlers - rely on isAtEdge state with dwell time
  const handleTouchStartWithEdgeCheck = useCallback((event: TouchEvent) => {
    // Only start tracking if at edge (with dwell time requirement met)
    if (!isAtEdge) return
    handleTouchStart(event)
  }, [isAtEdge, handleTouchStart])

  const handleTouchMoveWithEdgeCheck = useCallback((event: TouchEvent) => {
    // Process touch move events
    handleTouchMove(event)
  }, [handleTouchMove])

  // Attach touch event listeners
  useEffect(() => {
    const skillsSection = skillsSectionRef.current
    const librarySection = librarySectionRef.current

    if (currentView === 'skills' && skillsSection) {
      skillsSection.addEventListener('touchstart', handleTouchStartWithEdgeCheck, { passive: false })
      skillsSection.addEventListener('touchmove', handleTouchMoveWithEdgeCheck, { passive: false })
      skillsSection.addEventListener('touchend', handleTouchEnd, { passive: false })

      return () => {
        skillsSection.removeEventListener('touchstart', handleTouchStartWithEdgeCheck)
        skillsSection.removeEventListener('touchmove', handleTouchMoveWithEdgeCheck)
        skillsSection.removeEventListener('touchend', handleTouchEnd)
      }
    }

    if (currentView === 'library' && librarySection) {
      librarySection.addEventListener('touchstart', handleTouchStartWithEdgeCheck, { passive: false })
      librarySection.addEventListener('touchmove', handleTouchMoveWithEdgeCheck, { passive: false })
      librarySection.addEventListener('touchend', handleTouchEnd, { passive: false })

      return () => {
        librarySection.removeEventListener('touchstart', handleTouchStartWithEdgeCheck)
        librarySection.removeEventListener('touchmove', handleTouchMoveWithEdgeCheck)
        librarySection.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [handleTouchStartWithEdgeCheck, handleTouchMoveWithEdgeCheck, handleTouchEnd, currentView])

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
        <div ref={skillsSectionRef} className="h-screen relative overflow-y-auto">
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
            scrollProgress={isAtEdge && showIndicator ? progress : 0}
            scrollDirection={isAtEdge && showIndicator ? direction : null}
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