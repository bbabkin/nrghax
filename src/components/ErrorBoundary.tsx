'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/button'
import { AlertTriangle, RefreshCcw, Home, Bug, Mail } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string
}

// Error boundary class component (required for catching React errors)
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorId: this.generateErrorId()
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log error to monitoring service
    this.logError(error, errorInfo)
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    // In production, send to error monitoring service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo })
      console.error('Error logged to monitoring service:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    }
  }

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorId: this.generateErrorId()
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReportBug = () => {
    const { error, errorId } = this.state
    const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`)
    const body = encodeURIComponent(`
Error ID: ${errorId}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Details:
${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Steps to Reproduce:
1. 
2. 
3. 

Additional Context:
Please describe what you were doing when this error occurred.
    `.trim())
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`)
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorId } = this.state

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg border p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-gray-900">
                Something went wrong
              </h1>
              <p className="text-gray-600">
                We&apos;re sorry, but an unexpected error has occurred. This has been logged and we&apos;ll look into it.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Development Error Details:
                </h3>
                <div className="text-xs text-red-700 space-y-1">
                  <p><strong>Message:</strong> {error.message}</p>
                  <p><strong>Error ID:</strong> {errorId}</p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Stack Trace</summary>
                      <pre className="mt-1 text-xs overflow-x-auto bg-red-100 p-2 rounded">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry} 
                  className="flex-1"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload} 
                  variant="outline" 
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
              
              <Button 
                onClick={this.handleGoHome} 
                variant="ghost" 
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-xs text-gray-500">
                Error ID: <code className="bg-gray-100 px-1 rounded">{errorId}</code>
              </p>
              
              <Button
                onClick={this.handleReportBug}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <Bug className="w-3 h-3 mr-1" />
                Report Bug
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for function components to handle errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error handled by useErrorHandler:', error, errorInfo)
    
    // In a real app, log to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo })
    }
  }
}

// Async error boundary for handling async errors
export function AsyncErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason))
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (error) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg border p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Async Error Occurred
            </h1>
            <p className="text-gray-600">
              An error occurred while processing your request. Please try again.
            </p>
          </div>

          <Button onClick={() => setError(null)} className="w-full">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Error fallback components for specific use cases
export function FormErrorFallback({ 
  onRetry,
  message = 'Failed to load form. Please try again.' 
}: { 
  onRetry?: () => void
  message?: string 
}) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md border p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Form Error</h2>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        
        {onRetry && (
          <Button onClick={onRetry} size="sm">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}

export function PageErrorFallback({ 
  onRetry,
  title = 'Page Error',
  message = 'Failed to load this page. Please try again.' 
}: { 
  onRetry?: () => void
  title?: string
  message?: string 
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="space-y-3">
          {onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="outline" 
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => {
    const errorBoundaryProps: Props = {
      children: <Component {...props} />,
      ...(fallback !== undefined && { fallback }),
      ...(onError !== undefined && { onError })
    }
    
    return <ErrorBoundary {...errorBoundaryProps} />
  }
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}