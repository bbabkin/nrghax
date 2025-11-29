'use client'

import Link from 'next/link'
import Image from 'next/image'
import { User, Zap, BookOpen } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface FloatingNavProps {
  isAuthenticated?: boolean
  user?: {
    name?: string
    email?: string
    image?: string
  }
}

export function FloatingNav({ isAuthenticated, user }: FloatingNavProps) {
  const pathname = usePathname()

  // Don't show on auth pages, library/skills pages (they have their own nav), or detail pages (modal overlays)
  const shouldHide =
    pathname?.startsWith('/auth') ||
    pathname === '/library' ||
    pathname === '/skills' ||
    pathname?.startsWith('/hacks/') ||
    pathname?.startsWith('/routines/')

  if (shouldHide) {
    return null
  }

  const isSkillsPage = pathname === '/skills' || pathname?.startsWith('/skills/')
  const isLibraryPage = pathname === '/library' || pathname?.startsWith('/library/')

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto px-4 py-3">
        {/* Logo - Left */}
        <Link
          href="/"
          className="hover:scale-105 transition-transform"
        >
          <div className="w-12 h-12 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="NRGHAX Logo"
              width={48}
              height={48}
              className="drop-shadow-[0_0_5px_rgba(253,181,21,0.3)]"
            />
          </div>
        </Link>

        {/* Navigation Tabs - Center */}
        <nav className="flex items-center gap-1">
          <Link
            href="/skills"
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all min-w-[100px]",
              isSkillsPage
                ? "bg-yellow-500 text-black font-bold"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
            )}
          >
            <Zap className="w-5 h-5" />
            <span>Skills</span>
          </Link>
          <Link
            href="/library"
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all min-w-[100px]",
              isLibraryPage
                ? "bg-yellow-500 text-black font-bold"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
            )}
          >
            <BookOpen className="w-5 h-5" />
            <span>Library</span>
          </Link>
        </nav>

        {/* User Icon - Right */}
        <Link
          href={isAuthenticated ? '/dashboard' : '/auth'}
          className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 border-2 border-yellow-500 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_10px_rgba(253,181,21,0.3)]"
        >
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              width={44}
              height={44}
              className="rounded-full"
            />
          ) : (
            <User className="h-6 w-6 text-yellow-600" />
          )}
        </Link>
      </div>
    </div>
  )
}
