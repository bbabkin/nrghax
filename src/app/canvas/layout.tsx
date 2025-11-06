'use client'

import { useEffect } from 'react'

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Hide navbar and footer for canvas view
    const navbar = document.querySelector('nav')
    const footer = document.querySelector('footer')

    if (navbar) {
      (navbar as HTMLElement).style.display = 'none'
    }
    if (footer) {
      (footer as HTMLElement).style.display = 'none'
    }

    // Clean up on unmount
    return () => {
      if (navbar) {
        (navbar as HTMLElement).style.display = ''
      }
      if (footer) {
        (footer as HTMLElement).style.display = ''
      }
    }
  }, [])

  return <>{children}</>
}