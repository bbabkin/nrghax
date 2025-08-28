'use client'

import React, { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { PasswordResetForm } from '@/components/PasswordResetForm'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'

function ResetPasswordContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    if (status === 'loading') return
    
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'UserNotFound':
        return 'If an account with this email exists, we\'ll send a password reset link.'
      case 'InvalidEmail':
        return 'Please enter a valid email address.'
      case 'RateLimitExceeded':
        return 'Too many password reset requests. Please wait a few minutes before trying again.'
      case 'EmailServiceError':
        return 'Unable to send reset email at this time. Please try again later or contact support.'
      case 'TokenExpired':
        return 'The password reset link has expired. Please request a new one.'
      case 'TokenInvalid':
        return 'The password reset link is invalid. Please request a new one.'
      case 'PasswordTooWeak':
        return 'Your new password is too weak. Please choose a stronger password with at least 8 characters, including uppercase, lowercase, and numbers.'
      default:
        return error ? 'An error occurred while processing your request. Please try again.' : null
    }
  }

  const getSuccessMessage = (success: string | null) => {
    switch (success) {
      case 'email-sent':
        return 'If an account with this email exists, we\'ve sent password reset instructions.'
      case 'password-updated':
        return 'Your password has been successfully updated. You can now sign in with your new password.'
      default:
        return null
    }
  }

  const errorMessage = getErrorMessage(error)
  const successMessage = getSuccessMessage(success)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="max-w-md mx-auto">
            <div 
              role="alert" 
              className="flex items-start space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg"
              aria-live="polite"
            >
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* URL Error Message */}
        {errorMessage && (
          <div className="max-w-md mx-auto">
            <div 
              role="alert" 
              className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg"
              aria-live="polite"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Password Reset Error</h3>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Form */}
        <PasswordResetForm />
        
        {/* Security Information */}
        <div className="max-w-md mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-blue-700 space-y-2">
                <h3 className="font-medium">Password Reset Security</h3>
                <ul className="space-y-1 text-xs">
                  <li>• Reset links expire after 1 hour for security</li>
                  <li>• Each link can only be used once</li>
                  <li>• Check your spam folder if you don&apos;t see the email</li>
                  <li>• Contact support if you continue having issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="max-w-md mx-auto text-center">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              Remember your password?{' '}
              <a 
                href="/login" 
                className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Sign in instead
              </a>
            </p>
            <p>
              Need additional help?{' '}
              <a 
                href="mailto:support@example.com" 
                className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="max-w-md mx-auto">
          <details className="bg-gray-50 border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Troubleshooting Tips
            </summary>
            <div className="px-4 pb-3 text-xs text-gray-600 space-y-2">
              <p><strong>Email not arriving?</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check your spam or junk folder</li>
                <li>Wait 5-10 minutes for delivery</li>
                <li>Ensure the email address is correct</li>
                <li>Try requesting a new reset link</li>
              </ul>
              <p><strong>Reset link not working?</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Links expire after 1 hour</li>
                <li>Each link can only be used once</li>
                <li>Copy the full URL from your email</li>
                <li>Request a new link if expired</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

