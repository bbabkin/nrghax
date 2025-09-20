'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

interface NavbarProps {
  user?: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    isAdmin: boolean
  } | null
}

export function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/hacks', label: 'Hacks' },
    ...(user ? [
      { href: '/routines', label: 'My Routines' },
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/profile/history', label: 'My History' },
      { href: '/account', label: 'Account' },
      ...(user?.isAdmin ? [
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/hacks', label: 'Manage Hacks' },
        { href: '/admin/routines', label: 'Manage Routines' },
        { href: '/admin/tags', label: 'Tags' },
        { href: '/admin/onboarding', label: 'Onboarding' },
      ] : []),
    ] : []),
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                NRG Hax
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {user.name || user.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href)
                      ? 'text-primary bg-primary/10 rounded-md'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="pt-3 border-t space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 px-2 py-2">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt="Profile"
                          className="h-10 w-10 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {user.name || 'User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href="/auth">Login</Link>
                    </Button>
                    <Button size="sm" className="w-full" asChild>
                      <Link href="/auth">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}