'use client'

import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'
import { usePathname } from 'next/navigation'

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

  // Don't show on auth, library, skills, or canvas pages (they have integrated nav)
  if (pathname?.startsWith('/auth') || pathname === '/library' || pathname === '/skills' || pathname === '/canvas') {
    return null
  }

  return (
    <div className="fixed top-6 left-6 right-6 z-50 pointer-events-none">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo - Left */}
        <Link
          href="/"
          className="pointer-events-auto hover:scale-105 transition-transform"
        >
          <div className="w-20 h-20 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="NRGHAX Logo"
              width={80}
              height={80}
              className="drop-shadow-[0_0_20px_rgba(253,181,21,0.5)] dark:invert"
              style={{ filter: 'drop-shadow(0 0 20px rgba(253, 181, 21, 0.5))' }}
            />
          </div>
        </Link>

        {/* User Icon - Right */}
        <Link
          href={isAuthenticated ? '/dashboard' : '/auth'}
          className="pointer-events-auto w-20 h-20 rounded-full bg-gray-800 hover:bg-gray-700 border-2 border-yellow-400 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(253,181,21,0.5)]"
        >
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || 'User'}
              width={76}
              height={76}
              className="rounded-full"
            />
          ) : (
            <User className="h-10 w-10 text-yellow-400" />
          )}
        </Link>
      </div>
    </div>
  )
}
