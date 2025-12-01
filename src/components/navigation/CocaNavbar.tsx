'use client'

import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useNavbarHeight } from '@/hooks/useNavbarHeight'

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
  const svgHeight = useNavbarHeight()

  const isSkillsPage = pathname === '/skills' || pathname?.startsWith('/skills/')
  const isLibraryPage = pathname === '/library' || pathname?.startsWith('/library/')

  // Determine navbar position based on current page
  const position = isSkillsPage ? 'bottom' : 'top'

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

      {/* Top Navbar Container - Always at top */}
      <div
        className={cn(
          "absolute top-0 w-full z-40 transition-opacity duration-[800ms]",
          !isLibraryPage && "opacity-0 pointer-events-none"
        )}
        style={{ height: svgHeight }}
      >
        <div className="relative w-full h-full">
          {/* Library Title - Active when on Library page */}
          <div
            className={cn(
              "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-xl lg:text-2xl xl:text-3xl text-gray-800",
              "left-[30%] sm:left-[35%]"
            )}
          >
            Library
          </div>

          {/* Skills Link - Clickable when on Library page */}
          <Link
            href="/skills"
            className={cn(
              "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-lg lg:text-xl xl:text-2xl",
              "text-gray-600 hover:text-gray-800 transition-colors hover:scale-105",
              "left-[70%] sm:left-[65%]"
            )}
          >
            Skills
          </Link>
        </div>
      </div>

      {/* Bottom Navbar Container - Always at bottom */}
      <div
        className={cn(
          "absolute bottom-0 w-full z-40 transition-opacity duration-[800ms]",
          !isSkillsPage && "opacity-0 pointer-events-none"
        )}
        style={{ height: svgHeight }}
      >
        <div className="relative w-full h-full">
          {/* Library Link - Clickable when on Skills page */}
          <Link
            href="/library"
            className={cn(
              "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-lg lg:text-xl xl:text-2xl",
              "text-gray-600 hover:text-gray-800 transition-colors hover:scale-105",
              "left-[30%] sm:left-[35%]"
            )}
          >
            Library
          </Link>

          {/* Skills Title - Active when on Skills page */}
          <div
            className={cn(
              "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-xl lg:text-2xl xl:text-3xl text-gray-800",
              "left-[70%] sm:left-[65%]"
            )}
          >
            Skills
          </div>
        </div>
      </div>
    </>
  )
}