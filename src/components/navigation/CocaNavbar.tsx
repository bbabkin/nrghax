'use client'

import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface CocaNavbarProps {
  isAuthenticated?: boolean
  user?: {
    name?: string
    email?: string
    image?: string
  }
}

export function CocaNavbar({ isAuthenticated, user }: CocaNavbarProps) {
  const pathname = usePathname()
  const [svgHeight, setSvgHeight] = useState('186.8px')

  const isSkillsPage = pathname === '/skills' || pathname?.startsWith('/skills/')
  const isLibraryPage = pathname === '/library' || pathname?.startsWith('/library/')

  // Determine navbar position based on current page
  const position = isSkillsPage ? 'bottom' : 'top'

  // Calculate responsive SVG height based on viewport width
  useEffect(() => {
    const calculateHeight = () => {
      const width = window.innerWidth
      const aspectRatio = 1050 / 2000 // Height/Width from SVG viewBox

      // Different scaling for different breakpoints
      if (width < 640) { // Mobile
        setSvgHeight('120px') // Smaller fixed height for mobile
      } else if (width < 1280) { // Tablet/Small desktop
        const height = width * aspectRatio * 0.15 // Scale down to 15% of full proportion
        setSvgHeight(`${Math.min(height, 200)}px`)
      } else if (width < 1536) { // Desktop
        const height = width * aspectRatio * 0.12 // Scale down to 12% of full proportion
        setSvgHeight(`${Math.min(height, 250)}px`)
      } else { // Large (>1536px)
        const height = width * aspectRatio * 0.1 // Scale down to 10% for very large screens
        setSvgHeight(`${Math.min(height, 300)}px`)
      }
    }

    calculateHeight()
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
  }, [])

  // Don't show on home, auth pages or detail modal pages
  const shouldHide =
    pathname === '/' ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/hacks/') ||
    pathname?.startsWith('/routines/')

  if (shouldHide) {
    return null
  }

  return (
    <>
      {/* Logo - Absolutely positioned at top-left corner */}
      <Link
        href="/"
        className="absolute top-8 left-8 z-50 hover:scale-105 transition-transform"
      >
        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gray-700/20 backdrop-blur-sm flex items-center justify-center">
          <Image
            src="/logo.svg"
            alt="NRGHAX Logo"
            width={48}
            height={48}
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          />
        </div>
      </Link>

      {/* User Icon - Absolutely positioned at top-right corner */}
      <Link
        href={isAuthenticated ? '/dashboard' : '/auth'}
        className="absolute top-8 right-8 z-50 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gray-700/20 backdrop-blur-sm border border-gray-400/30 flex items-center justify-center transition-all hover:scale-105 hover:bg-gray-700/30"
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <User className="h-7 w-7 lg:h-8 lg:w-8 text-gray-700" />
        )}
      </Link>

      {/* Main Navbar Container - No background, just positioning */}
      <div
        className={cn(
          "absolute w-full z-40 transition-all duration-700 ease-in-out",
          position === 'bottom' ? 'bottom-0' : 'top-0'
        )}
        style={{ height: svgHeight }}
      >
        {/* Content Layer - Navigation Buttons */}
        <div className="relative w-full h-full">
          {/* Library Button/Label - Positioned at left curve circle (35% width) */}
          {isLibraryPage ? (
            <div
              className={cn(
                "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-xl lg:text-2xl xl:text-3xl text-gray-800",
                "left-[30%] sm:left-[35%]" // Align with SVG circle at 35%
              )}
            >
              Library
            </div>
          ) : (
            <Link
              href="/library"
              className={cn(
                "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-lg lg:text-xl xl:text-2xl",
                "text-gray-600 hover:text-gray-800 transition-all hover:scale-105",
                "left-[30%] sm:left-[35%]" // Align with SVG circle at 35%
              )}
            >
              Library
            </Link>
          )}

          {/* Skills Button/Label - Positioned at right curve circle (65% width) */}
          {isSkillsPage ? (
            <div
              className={cn(
                "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-xl lg:text-2xl xl:text-3xl text-gray-800",
                "left-[70%] sm:left-[65%]" // Align with SVG circle at 65%
              )}
            >
              Skills
            </div>
          ) : (
            <Link
              href="/skills"
              className={cn(
                "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-lg lg:text-xl xl:text-2xl",
                "text-gray-600 hover:text-gray-800 transition-all hover:scale-105",
                "left-[70%] sm:left-[65%]" // Align with SVG circle at 65%
              )}
            >
              Skills
            </Link>
          )}
        </div>
      </div>
    </>
  )
}