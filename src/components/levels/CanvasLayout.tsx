'use client'

import { useState } from 'react'
import { UnifiedCanvas } from './UnifiedCanvas'
import { LibrarySkillsNavCanvasSVG } from '@/components/navigation/LibrarySkillsNavCanvasSVG'

interface CanvasLayoutProps {
  skillsData: {
    levels?: any[]
    hacks?: any[]
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
}

export function CanvasLayout({
  skillsData,
  libraryData,
  isAuthenticated = false,
  isAdmin = false,
  user,
  initialView = 'skills'
}: CanvasLayoutProps) {
  const [currentView, setCurrentView] = useState<'skills' | 'library'>(initialView)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleViewChange = (newView: 'skills' | 'library') => {
    if (newView === currentView || isAnimating) return

    setIsAnimating(true)
    setCurrentView(newView)

    // Reset animation state after transition completes
    setTimeout(() => {
      setIsAnimating(false)
    }, 800)
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Fixed Navigation Bar - Outside of any transforms */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-auto">
        <LibrarySkillsNavCanvasSVG
          currentView={currentView}
          onViewChange={handleViewChange}
          disabled={isAnimating}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          user={user}
          scrollProgress={0}
          scrollDirection={null}
        />
      </div>

      {/* Unified Canvas - Without internal navigation */}
      <UnifiedCanvas
        skillsData={skillsData}
        libraryData={libraryData}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        user={user}
        initialView={initialView}
        currentView={currentView}
        onViewChange={handleViewChange}
        isAnimating={isAnimating}
        setIsAnimating={setIsAnimating}
      />
    </div>
  )
}