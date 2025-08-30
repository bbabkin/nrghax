'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Loader2, Shield, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import Link from 'next/link'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
  requireVerified?: boolean
  allowedRoles?: string[]
  className?: string
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = '/login',
  requireVerified = false,
  allowedRoles,
  className = '',
}: ProtectedRouteProps) {
  const { user, loading } = useUser()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      setIsRedirecting(true)
      // Add current URL as redirect parameter
      const currentUrl = window.location.pathname + window.location.search
      const redirectUrl = `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}redirect=${encodeURIComponent(currentUrl)}`
      router.push(redirectUrl)
      return
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user?.role
      if (!userRole || !allowedRoles.includes(userRole)) {
        setIsRedirecting(true)
        router.push('/access-denied?reason=insufficient_permissions')
        return
      }
    }
  }, [user, loading, router, redirectTo, requireVerified, allowedRoles])

  // Loading state
  if (loading || isRedirecting) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-md border p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {isRedirecting ? 'Redirecting...' : 'Loading...'}
            </h2>
            <p className="text-gray-600">
              {isRedirecting 
                ? 'Please wait while we redirect you'
                : 'Please wait while we verify your access'
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-md border p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
            <p className="text-gray-600">
              You need to be signed in to access this page.
            </p>
          </div>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href={redirectTo}>Sign In</Link>
            </Button>
            <Link
              href="/"
              className="block text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Go back home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Email verification check removed - NextAuth session doesn't include emailVerified

  // Role-based access control
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      if (fallback) {
        return <>{fallback}</>
      }

      return (
        <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
          <div className="max-w-md w-full bg-white rounded-lg shadow-md border p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
              <p className="text-gray-600">
                You don&apos;t have permission to access this page. Contact an administrator if you believe this is an error.
              </p>
            </div>
            <div className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
              <Link
                href="/"
                className="block text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Go back home
              </Link>
            </div>
          </div>
        </div>
      )
    }
  }

  // All checks passed - render children
  return <div className={className}>{children}</div>
}

// Higher Order Component version
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  const AuthenticatedComponent = (props: P) => {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    )
  }

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`

  return AuthenticatedComponent
}

// Hook for getting protected route status
export function useProtectedRoute(options: Omit<ProtectedRouteProps, 'children'> = {}) {
  const { user, loading } = useUser()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) {
      setIsLoading(true)
      return
    }

    setIsLoading(false)

    if (!user) {
      setIsAuthorized(false)
      setError('Authentication required')
      return
    }

    if (options.allowedRoles && options.allowedRoles.length > 0) {
      const userRole = user?.role
      if (!userRole || !options.allowedRoles.includes(userRole)) {
        setIsAuthorized(false)
        setError('Insufficient permissions')
        return
      }
    }

    setIsAuthorized(true)
    setError(null)
  }, [user, loading, options.requireVerified, options.allowedRoles])

  return {
    isAuthorized,
    isLoading,
    error,
    user,
  }
}