'use client'

import { usePathname } from 'next/navigation'
import { CocaNavbar } from './CocaNavbar'
import { useEffect } from 'react'

interface NavigationWrapperProps {
  isAuthenticated: boolean
  user?: {
    name?: string
    email?: string
    image?: string
  }
  children: React.ReactNode
}

export function NavigationWrapper({ isAuthenticated, user, children }: NavigationWrapperProps) {
  const pathname = usePathname()
  const isLibraryPage = pathname === '/library' || pathname?.startsWith('/library/')
  const isSkillsPage = pathname === '/skills' || pathname?.startsWith('/skills/')

  // Apply styles directly to body element
  useEffect(() => {
    // Add smooth transitions for background changes with ease-in-out
    document.body.style.transition = 'background-position 0.8s ease-in-out, background-color 0.4s ease-in-out'

    const updateBackgroundPosition = () => {
      const aspectRatio = 1050 / 2000
      const viewportWidth = window.innerWidth
      const bgHeight = viewportWidth * aspectRatio

      if (isLibraryPage) {
        // To show bottom half: position so vertical center aligns with top of page
        const libOffsetPixels = -(bgHeight / 2) + (bgHeight/20)

        document.body.style.backgroundColor = '#FFFFFF'
        document.body.style.backgroundImage = 'url(/coca_bg_lg.svg)'
        document.body.style.backgroundRepeat = 'no-repeat'
        document.body.style.backgroundPosition = `center ${libOffsetPixels}px`
        document.body.style.backgroundSize = '100% auto'
      } else if (isSkillsPage) {
        // For skills page: center of background at bottom of viewport
        // This shows the top half of the SVG
        const skillOffsetPixels = window.innerHeight - (bgHeight / 2)-(bgHeight/20)

        document.body.style.backgroundColor = '#FFFFFF'
        document.body.style.backgroundImage = 'url(/coca_bg_lg.svg)'
        document.body.style.backgroundRepeat = 'no-repeat'
        document.body.style.backgroundPosition = `center ${skillOffsetPixels}px`
        document.body.style.backgroundSize = '100% auto'
      }
    }

    if (isLibraryPage || isSkillsPage) {
      updateBackgroundPosition()
      window.addEventListener('resize', updateBackgroundPosition)
    } else {
      document.body.style.backgroundColor = '#B8B8B8'
      document.body.style.backgroundImage = ''
    }

    // Cleanup function
    return () => {
      window.removeEventListener('resize', updateBackgroundPosition)
      document.body.style.backgroundColor = ''
      document.body.style.backgroundImage = ''
      document.body.style.backgroundRepeat = ''
      document.body.style.backgroundPosition = ''
      document.body.style.backgroundSize = ''
      document.body.style.transition = ''
    }
  }, [pathname, isLibraryPage, isSkillsPage])

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
      `}</style>

      <CocaNavbar isAuthenticated={isAuthenticated} user={user} />

      <main className="flex-1">
        {children}
      </main>
    </>
  )
}