'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { CustomSkillsTree } from './CustomSkillsTree'
import { LibraryView } from '@/components/library/LibraryView'
import { useScrollNavigation } from '@/hooks/useScrollNavigation'

interface UnifiedCanvasProps {
  skillsData: {
    levels?: any[] // Array of levels with their hacks
    hacks?: any[] // Legacy single level hacks
    levelSlug: string
    levelName: string
  }
  libraryData: {
    hacks: any[]
    routines: any[]
  }
  isAuthenticated?: boolean
  isAdmin?: boolean
  user?: {
    name?: string
    email?: string
    image?: string
  }
  initialView?: 'skills' | 'library'
  currentView?: 'skills' | 'library'
  onViewChange?: (view: 'skills' | 'library') => void
  isAnimating?: boolean
  setIsAnimating?: (isAnimating: boolean) => void
}

export function UnifiedCanvas({
  skillsData,
  libraryData,
  isAuthenticated = false,
  isAdmin = false,
  user,
  initialView = 'skills',
  currentView: currentViewProp,
  onViewChange: onViewChangeProp,
  isAnimating: isAnimatingProp,
  setIsAnimating: setIsAnimatingProp
}: UnifiedCanvasProps) {
  const router = useRouter()
  const [pathname, setPathname] = useState('')

  // Get pathname after mount to avoid SSR issues
  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])
  // Use prop values when provided (controlled mode), otherwise use internal state (uncontrolled mode)
  const [internalCurrentView, setInternalCurrentView] = useState<'skills' | 'library'>(initialView)
  const currentView = currentViewProp ?? internalCurrentView
  const setCurrentView = onViewChangeProp ?? setInternalCurrentView

  const [visualView, setVisualView] = useState<'skills' | 'library'>(initialView) // Visual state for navbar

  const [internalIsAnimating, setInternalIsAnimating] = useState(false)
  const isAnimating = isAnimatingProp ?? internalIsAnimating
  const setIsAnimating = setIsAnimatingProp ?? setInternalIsAnimating
  const [isAtEdge, setIsAtEdge] = useState(false) // Track if we're at an edge position - start false to prevent immediate transition
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const isInitialMount = useRef(true)

  // Debug logging
  console.log('[UnifiedCanvas] isAdmin:', isAdmin, 'isAuthenticated:', isAuthenticated)

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
        } else {
          // Enable animations after initial mount for normal page loads
          // Small delay to ensure components are fully mounted
          setTimeout(() => {
            setShouldAnimate(true)
          }, 100)
        }
      } else {
        // Enable animations after initial mount
        setTimeout(() => {
          setShouldAnimate(true)
        }, 100)
      }
    }
  }, [initialView])

  // Scroll to last unlocked hack when on skills view
  useEffect(() => {
    if (currentView === 'skills') {
      const skillsSection = skillsSectionRef.current
      if (!skillsSection) return

      // Function to scroll to last unlocked hack
      const scrollToLastUnlockedHack = () => {
        // Try multiple selectors to find the skills container
        let actualSkillsContainer = skillsSection.querySelector('.overflow-y-auto') || skillsSection

        // Find all hack button elements using data attributes
        const allButtons = actualSkillsContainer.querySelectorAll('button[data-hack-id]')

        // Filter to find unlocked hacks using data-hack-unlocked attribute
        const unlockedHacks = Array.from(allButtons).filter(button => {
          return button.getAttribute('data-hack-unlocked') === 'true'
        })

        console.log(`[ScrollDebug] Total hack buttons found: ${allButtons.length}`)
        console.log(`[ScrollDebug] Unlocked hacks: ${unlockedHacks.length}`)

        if (allButtons.length > 0) {
          // Log info about all hacks
          allButtons.forEach((button, i) => {
            const isUnlocked = button.getAttribute('data-hack-unlocked')
            const hackName = button.getAttribute('data-hack-name')
            console.log(`[ScrollDebug] Hack ${i}: "${hackName}" - unlocked: ${isUnlocked}`)
          })
        }

        if (unlockedHacks.length > 0) {
          // Since hacks are rendered in reverse order (bottom to top),
          // we need to find the FIRST unlocked hack in DOM order
          // which represents the last unlocked hack in the progression
          const lastUnlockedInProgression = unlockedHacks[0] as HTMLElement
          const hackTitle = lastUnlockedInProgression.getAttribute('data-hack-name') || 'Unknown'

          // Calculate position to show it at the bottom of viewport
          const rect = lastUnlockedInProgression.getBoundingClientRect()
          const containerRect = actualSkillsContainer.getBoundingClientRect()
          const relativeTop = rect.top - containerRect.top + actualSkillsContainer.scrollTop

          // Position the hack at the bottom of the viewport with some padding
          const targetScroll = relativeTop - actualSkillsContainer.clientHeight + rect.height + 100

          actualSkillsContainer.scrollTop = Math.max(0, targetScroll)

          console.log(`[ScrollDebug] Scrolled to last unlocked hack: "${hackTitle}"`)
          console.log(`[ScrollDebug] Target scroll: ${targetScroll}, Actual scroll: ${actualSkillsContainer.scrollTop}`)
          console.log(`[ScrollDebug] Container height: ${actualSkillsContainer.clientHeight}, Scroll height: ${actualSkillsContainer.scrollHeight}`)
        } else {
          // If no unlocked hacks, stay at top (where the first/base hacks would be)
          console.log('[ScrollDebug] No unlocked hacks found - this might indicate all hacks have prerequisites')
          // Since hacks are rendered bottom-to-top, the top of the container shows the earliest hacks
          actualSkillsContainer.scrollTop = 0
        }
      }

      // Use MutationObserver to detect when content loads
      let hasScrolled = false
      const observer = new MutationObserver(() => {
        if (!hasScrolled) {
          scrollToLastUnlockedHack()
          hasScrolled = true
        }
      })

      // Start observing
      observer.observe(skillsSection, {
        childList: true,
        subtree: true,
        attributes: false
      })

      // Initial attempt with a small delay for content to render
      const timer = setTimeout(scrollToLastUnlockedHack, 250)

      // Cleanup
      return () => {
        observer.disconnect()
        clearTimeout(timer)
      }
    } else if (currentView === 'library') {
      // Reset library scroll to top when switching to library
      const librarySection = librarySectionRef.current
      if (librarySection) {
        librarySection.scrollTop = 0
      }
    }
  }, [currentView])

  // Hide navbar and footer by adding a class to body
  useEffect(() => {
    // Add class to body to hide navbar/footer
    document.body.classList.add('hide-nav-footer')

    return () => {
      // Remove class when unmounting
      document.body.classList.remove('hide-nav-footer')
    }
  }, [])

  // Handle browser back/forward navigation
  useEffect(() => {
    // Determine expected view from pathname
    // Check if pathname starts with /skills to handle both /skills and /skills/[slug] routes
    const expectedView = pathname.startsWith('/skills') ? 'skills' : 'library'

    // Only update if view actually changed and we're not animating
    if (currentView !== expectedView && !isAnimating) {
      console.log(`[UnifiedCanvas] Syncing view from pathname: ${pathname} -> ${expectedView}`)
      setShouldAnimate(true)
      setCurrentView(expectedView)
      // Also sync visual view for browser navigation
      setTimeout(() => {
        setVisualView(expectedView)
      }, 50)
    }
  }, [pathname, currentView, isAnimating])

  const handleViewChange = (view: 'skills' | 'library') => {
    console.log(`[UnifiedCanvas] handleViewChange called: ${view}, current: ${currentView}, isAnimating: ${isAnimating}`)

    if (view === currentView || isAnimating) {
      console.log(`[UnifiedCanvas] Ignoring view change - already on ${view} or animating`)
      return
    }

    console.log(`[UnifiedCanvas] Proceeding with view change to ${view}`)
    // Enable animation for user-initiated navigation
    setShouldAnimate(true)
    setIsAnimating(true)
    setCurrentView(view)

    // Delay visual state update to sync with animation start
    // This prevents the navbar from jumping
    setTimeout(() => {
      setVisualView(view)
    }, 50) // Small delay to allow animation to start

    // Update URL to match the new view without causing full page reload
    if (typeof window !== 'undefined') {
      const newPath = view === 'skills' ? '/skills' : '/library'
      // Only navigate if we're not already on the correct path
      // For skills, check if pathname starts with /skills to avoid unnecessary navigation
      const needsNavigation = view === 'skills'
        ? !pathname.startsWith('/skills')
        : pathname !== '/library'

      if (needsNavigation) {
        console.log(`[UnifiedCanvas] Navigating from ${pathname} to ${newPath}`)
        router.push(newPath)
      }
    }

    // Reset animation flag after animation completes
    setTimeout(() => {
      setIsAnimating(false)
      // Ensure visual state is synced
      setVisualView(view)
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
        initial={{
          y: initialView === 'library' ? 'calc(-100vh + 80px)' : 0
        }}
        animate={{
          y: currentView === 'library' ? 'calc(-100vh + 80px)' : 0
        }}
        transition={
          shouldAnimate
            ? {
                type: "spring",
                damping: 30,
                stiffness: 200,
                mass: 0.8
              }
            : { duration: 0 }
        }
      >
        {/* Skills Section (Top Half) */}
        <div ref={skillsSectionRef} className="h-screen relative overflow-y-auto">
          <CustomSkillsTree
            levels={skillsData.levels}
            hacks={skillsData.hacks} // Keep for backward compatibility
            levelSlug={skillsData.levelSlug}
            levelName={skillsData.levelName}
            isAuthenticated={isAuthenticated}
          />
        </div>


        {/* Library Section (Bottom Half) */}
        <div ref={librarySectionRef} className="h-screen relative overflow-y-auto">
          <LibraryView
            hacks={libraryData.hacks}
            routines={libraryData.routines}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
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