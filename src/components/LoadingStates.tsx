'use client'

import React from 'react'
import { Loader2, Shield, User, Settings, Clock } from 'lucide-react'

// Generic loading spinner
export function LoadingSpinner({ 
  size = 'default',
  className = '' 
}: { 
  size?: 'sm' | 'default' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      aria-hidden="true"
    />
  )
}

// Page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header skeleton */}
        <div className="bg-gray-200 rounded-2xl h-32"></div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-6 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Form loading skeleton
export function FormLoadingSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto animate-pulse">
      <div className="bg-white rounded-lg shadow-md border p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-full mx-auto"></div>
        </div>
        
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
          
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  )
}

// Button loading state
export function ButtonLoadingState({ 
  children, 
  isLoading, 
  loadingText = 'Loading...',
  className = '',
  ...props 
}: { 
  children: React.ReactNode
  isLoading: boolean
  loadingText?: string
  className?: string
  [key: string]: any
}) {
  return (
    <button 
      className={`inline-flex items-center justify-center ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Navigation loading state
export function NavbarLoadingSkeleton() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    </nav>
  )
}

// Dashboard stats loading
export function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Card loading skeleton
export function CardLoadingSkeleton({ 
  title = true, 
  content = 3,
  className = '' 
}: { 
  title?: boolean
  content?: number
  className?: string 
}) {
  return (
    <div className={`bg-white rounded-lg border shadow-sm p-6 animate-pulse ${className}`}>
      {title && (
        <div className="border-b border-gray-200 pb-4 mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: content }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Loading states for specific components
export function UserMenuLoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
    </div>
  )
}

export function ActivityLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="space-y-1 flex-1">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Centered loading state for full page
export function CenteredLoadingState({ 
  message = 'Loading...',
  icon: Icon = Loader2,
  className = '' 
}: {
  message?: string
  icon?: React.ElementType
  className?: string
}) {
  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <Icon className="w-8 h-8 animate-spin text-blue-600" aria-hidden="true" />
        <p className="text-gray-600" role="status" aria-live="polite">
          {message}
        </p>
      </div>
    </div>
  )
}

// Inline loading state
export function InlineLoadingState({
  message = 'Loading...',
  size = 'default',
  className = ''
}: {
  message?: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} className="text-blue-600" />
      <span className="text-gray-600">{message}</span>
    </div>
  )
}

// Progress loading bar
export function ProgressLoadingBar({ 
  progress = 0,
  className = '',
  showPercentage = false 
}: { 
  progress?: number
  className?: string
  showPercentage?: boolean 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {showPercentage && (
        <div className="flex justify-between text-sm">
          <span>Loading...</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}