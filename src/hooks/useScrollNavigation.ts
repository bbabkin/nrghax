'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type ScrollDirection = 'up' | 'down' | null

interface UseScrollNavigationProps {
  threshold?: number // Pixels to scroll before triggering navigation
  onNavigate: (direction: 'up' | 'down') => void
  isEnabled: boolean // Whether scroll navigation is active
  currentView: 'skills' | 'library'
  isAnimating: boolean // Don't trigger during existing animations
}

interface ScrollNavigationState {
  progress: number // 0-100
  direction: ScrollDirection
  showIndicator: boolean
  accumulatedScroll: number
}

export function useScrollNavigation({
  threshold = 400,
  onNavigate,
  isEnabled,
  currentView,
  isAnimating,
}: UseScrollNavigationProps) {
  const [state, setState] = useState<ScrollNavigationState>({
    progress: 0,
    direction: null,
    showIndicator: false,
    accumulatedScroll: 0,
  })

  const lastDirectionRef = useRef<ScrollDirection>(null)
  const touchStartYRef = useRef<number | null>(null)
  const isTouchingRef = useRef(false)
  const resetTimeoutRef = useRef<NodeJS.Timeout>()

  // Reset progress if user stops scrolling
  const scheduleReset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
    }
    resetTimeoutRef.current = setTimeout(() => {
      setState({
        progress: 0,
        direction: null,
        showIndicator: false,
        accumulatedScroll: 0,
      })
      lastDirectionRef.current = null
    }, 500) // Reset after 500ms of no scrolling
  }, [])

  // Handle wheel events (desktop)
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!isEnabled || isAnimating) return

      const direction: ScrollDirection = event.deltaY > 0 ? 'down' : 'up'

      // Only allow scrolling down from skills, up from library
      if (
        (currentView === 'skills' && direction === 'up') ||
        (currentView === 'library' && direction === 'down')
      ) {
        return
      }

      // If direction changed, reset accumulation
      if (lastDirectionRef.current && lastDirectionRef.current !== direction) {
        setState({
          progress: 0,
          direction,
          showIndicator: true,
          accumulatedScroll: 0,
        })
        lastDirectionRef.current = direction
        scheduleReset()
        return
      }

      lastDirectionRef.current = direction

      setState((prev) => {
        const newAccumulated = prev.accumulatedScroll + Math.abs(event.deltaY)
        const newProgress = Math.min(100, (newAccumulated / threshold) * 100)

        // Trigger navigation when threshold is reached
        if (newProgress >= 100) {
          onNavigate(direction)
          scheduleReset()
          return {
            progress: 0,
            direction: null,
            showIndicator: false,
            accumulatedScroll: 0,
          }
        }

        scheduleReset()
        return {
          progress: newProgress,
          direction,
          showIndicator: true,
          accumulatedScroll: newAccumulated,
        }
      })
    },
    [isEnabled, isAnimating, currentView, threshold, onNavigate, scheduleReset]
  )

  // Handle touch events (mobile)
  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchStartYRef.current = event.touches[0].clientY
    isTouchingRef.current = true
  }, [])

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isEnabled || isAnimating || !isTouchingRef.current) return
      if (touchStartYRef.current === null) return

      const currentY = event.touches[0].clientY
      const deltaY = touchStartYRef.current - currentY
      const direction: ScrollDirection = deltaY > 0 ? 'down' : 'up'

      // Only allow swiping down from skills, up from library
      if (
        (currentView === 'skills' && direction === 'up') ||
        (currentView === 'library' && direction === 'down')
      ) {
        return
      }

      // If direction changed, reset
      if (lastDirectionRef.current && lastDirectionRef.current !== direction) {
        setState({
          progress: 0,
          direction,
          showIndicator: true,
          accumulatedScroll: 0,
        })
        lastDirectionRef.current = direction
        touchStartYRef.current = currentY // Reset touch start point
        return
      }

      lastDirectionRef.current = direction
      const absDeltaY = Math.abs(deltaY)

      setState({
        progress: Math.min(100, (absDeltaY / threshold) * 100),
        direction,
        showIndicator: true,
        accumulatedScroll: absDeltaY,
      })
    },
    [isEnabled, isAnimating, currentView, threshold]
  )

  const handleTouchEnd = useCallback(() => {
    if (!isTouchingRef.current) return
    isTouchingRef.current = false

    setState((prev) => {
      // Trigger navigation if threshold was met
      if (prev.progress >= 100 && prev.direction) {
        onNavigate(prev.direction)
      }

      // Reset state
      scheduleReset()
      return prev
    })

    touchStartYRef.current = null
    lastDirectionRef.current = null
  }, [onNavigate, scheduleReset])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...state,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}
