'use client'

import { useState, useEffect } from 'react'

export function useNavbarHeight() {
  const [navbarHeight, setNavbarHeight] = useState('186.8px')

  useEffect(() => {
    const calculateHeight = () => {
      const width = window.innerWidth
      const aspectRatio = 1050 / 2000 // Height/Width from SVG viewBox

      // Different scaling for different breakpoints - same logic as CocaNavbar
      if (width < 640) { // Mobile
        setNavbarHeight('120px') // Smaller fixed height for mobile
      } else if (width < 1280) { // Tablet/Small desktop
        const height = width * aspectRatio * 0.15 // Scale down to 15% of full proportion
        setNavbarHeight(`${Math.min(height, 200)}px`)
      } else if (width < 1536) { // Desktop
        const height = width * aspectRatio * 0.12 // Scale down to 12% of full proportion
        setNavbarHeight(`${Math.min(height, 250)}px`)
      } else { // Large (>1536px)
        const height = width * aspectRatio * 0.1 // Scale down to 10% for very large screens
        setNavbarHeight(`${Math.min(height, 300)}px`)
      }
    }

    calculateHeight()
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [])

  return navbarHeight
}