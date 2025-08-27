'use client'

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  ChevronDown,
  Loader2 
} from 'lucide-react'

interface UserMenuProps {
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

export function UserMenu({ 
  className = '', 
  align = 'end', 
  sideOffset = 4 
}: UserMenuProps) {
  const { data: session, status } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (status === 'loading') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button variant="ghost" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Sign up</Link>
        </Button>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const userDisplayName = session.user?.name || session.user?.email || 'User'
  const userEmail = session.user?.email || ''
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2 px-3 py-2 h-auto focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="User menu"
          >
            {/* Avatar */}
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt={`${userDisplayName}'s avatar`}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div 
                className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-medium flex items-center justify-center"
                aria-hidden="true"
              >
                {getInitials(userDisplayName)}
              </div>
            )}
            
            {/* Name and chevron */}
            <div className="flex items-center space-x-1 min-w-0">
              <span className="truncate max-w-32 text-sm font-medium">
                {userDisplayName}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-500" aria-hidden="true" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align={align} 
          className="w-64" 
          sideOffset={sideOffset}
        >
          {/* User Info Header */}
          <DropdownMenuLabel>
            <div className="flex items-center space-x-3 py-1">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={`${userDisplayName}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center"
                  aria-hidden="true"
                >
                  {getInitials(userDisplayName)}
                </div>
              )}
              <div className="flex flex-col space-y-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {userDisplayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Navigation Items */}
          <DropdownMenuItem asChild>
            <Link 
              href="/dashboard" 
              className="cursor-pointer w-full flex items-center"
            >
              <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link 
              href="/profile" 
              className="cursor-pointer w-full flex items-center"
            >
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              Profile
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link 
              href="/settings" 
              className="cursor-pointer w-full flex items-center"
            >
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              Settings
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Logout */}
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Log out
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Simplified version for mobile usage
export function UserMenuMobile({ 
  className = '',
  onMenuItemClick 
}: { 
  className?: string
  onMenuItemClick?: () => void
}) {
  const { data: session, status } = useSession()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (status === 'loading') {
    return (
      <div className={`animate-pulse px-3 py-2 ${className}`}>
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={`space-y-1 ${className}`}>
        <Link
          href="/login"
          onClick={onMenuItemClick}
          className="text-gray-900 hover:text-gray-700 block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          role="menuitem"
        >
          Log in
        </Link>
        <Link
          href="/register"
          onClick={onMenuItemClick}
          className="bg-blue-600 text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          role="menuitem"
        >
          Sign up
        </Link>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      onMenuItemClick?.()
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const userDisplayName = session.user?.name || session.user?.email || 'User'
  const userEmail = session.user?.email || ''

  return (
    <div className={`space-y-1 ${className}`}>
      {/* User Info */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt={`${userDisplayName}'s avatar`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium flex items-center justify-center"
              aria-hidden="true"
            >
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-gray-900 truncate">
              {userDisplayName}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {userEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <Link
        href="/dashboard"
        onClick={onMenuItemClick}
        className="text-gray-900 hover:text-gray-700 flex items-center px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        role="menuitem"
      >
        <Shield className="mr-3 h-5 w-5" aria-hidden="true" />
        Dashboard
      </Link>

      <Link
        href="/profile"
        onClick={onMenuItemClick}
        className="text-gray-900 hover:text-gray-700 flex items-center px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        role="menuitem"
      >
        <User className="mr-3 h-5 w-5" aria-hidden="true" />
        Profile
      </Link>

      <Link
        href="/settings"
        onClick={onMenuItemClick}
        className="text-gray-900 hover:text-gray-700 flex items-center px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        role="menuitem"
      >
        <Settings className="mr-3 h-5 w-5" aria-hidden="true" />
        Settings
      </Link>

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full text-left text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
        role="menuitem"
      >
        {isLoggingOut ? (
          <>
            <Loader2 className="mr-3 h-5 w-5 animate-spin" aria-hidden="true" />
            Logging out...
          </>
        ) : (
          <>
            <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
            Log out
          </>
        )}
      </button>
    </div>
  )
}