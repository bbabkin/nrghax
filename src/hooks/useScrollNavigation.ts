'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type ScrollDirection = 'up' | 'down' | null
export type InputDevice = 'mouse' | 'trackpad' | 'touch' | 'unknown'

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

// Device detection helper
function detectInputDevice(): InputDevice {
  if (typeof window === 'undefined') return 'unknown'
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return 'touch'
  // Will be determined dynamically based on scroll patterns
  return 'unknown'
}

// Get device-specific threshold
function getDeviceThreshold(device: InputDevice, baseThreshold: number): number {
  switch (device) {
    case 'mouse':
      return baseThreshold * 1.5 // 600px for mouse
    case 'trackpad':
      return baseThreshold // 400px for trackpad
    case 'touch':
      return baseThreshold * 0.75 // 300px for touch
    default:
      return baseThreshold
  }
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

  // Device detection
  const deviceTypeRef = useRef<InputDevice>(detectInputDevice())
  const lastWheelEventTimeRef = useRef<number>(0)
  const wheelEventDeltasRef = useRef<number[]>([])

  // Momentum detection refs
  const isMomentumRef = useRef(false)
  const momentumPatternRef = useRef<number[]>([])

  // Reset progress if user stops scrolling
  const scheduleReset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
    }
    // Longer timeout for trackpad to account for momentum
    const timeout = deviceTypeRef.current === 'trackpad' ? 1500 : 500
    resetTimeoutRef.current = setTimeout(() => {
      setState({
        progress: 0,
        direction: null,
        showIndicator: false,
        accumulatedScroll: 0,
      })
      lastDirectionRef.current = null
      isMomentumRef.current = false
      momentumPatternRef.current = []
    }, timeout)
  }, [])

  // Handle wheel events (desktop)
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!isEnabled || isAnimating) return

      const now = Date.now()
      const deltaY = event.deltaY
      const absDeltaY = Math.abs(deltaY)

      // Detect device type based on deltaY patterns
      if (deviceTypeRef.current === 'unknown') {
        wheelEventDeltasRef.current.push(absDeltaY)
        if (wheelEventDeltasRef.current.length > 5) {
          wheelEventDeltasRef.current.shift()
        }

        const avgDelta = wheelEventDeltasRef.current.reduce((a, b) => a + b, 0) / wheelEventDeltasRef.current.length

        // Mouse typically has larger, consistent deltas
        // Trackpad has smaller, variable deltas
        if (avgDelta > 50 && wheelEventDeltasRef.current.every(d => d > 30)) {
          deviceTypeRef.current = 'mouse'
        } else if (avgDelta < 50) {
          deviceTypeRef.current = 'trackpad'
        }
      }

      // Momentum detection for trackpads
      if (deviceTypeRef.current === 'trackpad') {
        const timeSinceLastEvent = now - lastWheelEventTimeRef.current

        // Detect momentum: rapid succession of decreasing deltas
        if (timeSinceLastEvent < 50) { // Events within 50ms
          momentumPatternRef.current.push(absDeltaY)
          if (momentumPatternRef.current.length > 3) {
            momentumPatternRef.current.shift()

            // Check if deltas are decreasing (momentum pattern)
            const isDecreasing = momentumPatternRef.current.every((val, i) =>
              i === 0 || val <= momentumPatternRef.current[i - 1] * 1.1
            )

            if (isDecreasing && momentumPatternRef.current[0] > momentumPatternRef.current[2] * 1.5) {
              isMomentumRef.current = true
            }
          }
        } else {
          // Reset momentum detection on new scroll gesture
          momentumPatternRef.current = [absDeltaY]
          isMomentumRef.current = false
        }

        lastWheelEventTimeRef.current = now

        // Ignore momentum events
        if (isMomentumRef.current) {
          return
        }
      }

      const direction: ScrollDirection = deltaY > 0 ? 'down' : 'up'

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
          showIndicator: false, // Don't show immediately
          accumulatedScroll: 0,
        })
        lastDirectionRef.current = direction
        scheduleReset()
        return
      }

      lastDirectionRef.current = direction

      // Get device-specific threshold
      const deviceThreshold = getDeviceThreshold(deviceTypeRef.current, threshold)

      // Normalize deltaY for consistent accumulation
      let normalizedDelta = absDeltaY
      if (deviceTypeRef.current === 'mouse' && absDeltaY > 100) {
        // High-precision mouse wheels - normalize aggressive scrolling
        normalizedDelta = 50 + (absDeltaY - 100) * 0.3
      }

      setState((prev) => {
        const newAccumulated = prev.accumulatedScroll + normalizedDelta
        const newProgress = Math.min(100, (newAccumulated / deviceThreshold) * 100)

        // Only show indicator after 10% progress to reduce noise
        const shouldShowIndicator = newProgress >= 10

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
          showIndicator: shouldShowIndicator,
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
          showIndicator: false, // Don't show immediately
          accumulatedScroll: 0,
        })
        lastDirectionRef.current = direction
        touchStartYRef.current = currentY // Reset touch start point
        return
      }

      lastDirectionRef.current = direction
      const absDeltaY = Math.abs(deltaY)

      // Use touch-specific threshold (75% of base)
      const touchThreshold = getDeviceThreshold('touch', threshold)
      const progress = Math.min(100, (absDeltaY / touchThreshold) * 100)

      // Only show indicator after 10% progress
      const shouldShowIndicator = progress >= 10

      setState({
        progress,
        direction,
        showIndicator: shouldShowIndicator,
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

  // Reset state when isEnabled changes to false
  useEffect(() => {
    if (!isEnabled) {
      // Reset all state when disabled
      setState({
        progress: 0,
        direction: null,
        showIndicator: false,
        accumulatedScroll: 0,
      })
      lastDirectionRef.current = null
      isMomentumRef.current = false
      momentumPatternRef.current = []

      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [isEnabled])

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
