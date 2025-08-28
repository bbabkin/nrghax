'use client'

import React, { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { RegisterForm } from '@/components/RegisterForm'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'

function RegisterContent() {
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
      case 'UserAlreadyExists':
        return 'An account with this email already exists. Please sign in instead.'
      case 'InvalidEmail':
        return 'Please enter a valid email address.'
      case 'WeakPassword':
        return 'Password is too weak. Please choose a stronger password with at least 8 characters, including uppercase, lowercase, and numbers.'
      case 'ValidationError':
        return 'Please check your information and ensure all required fields are filled correctly.'
      case 'RateLimitExceeded':
        return 'Too many registration attempts. Please wait a few minutes before trying again.'
      case 'EmailServiceError':
        return 'Unable to send verification email. Your account was created, but please contact support to verify your email.'
      case 'DatabaseError':
        return 'There was an error creating your account. Please try again or contact support if the problem persists.'
      case 'OAuthAccountNotLinked':
        return 'An account with this email already exists. Please sign in with your email and password, then link your Google account in settings.'
      default:
        return error ? 'An error occurred during registration. Please try again.' : null
    }
  }

  const getSuccessMessage = (success: string | null) => {
    switch (success) {
      case 'verification-sent':
        return 'Registration successful! Please check your email to verify your account before signing in.'
      case 'account-created':
        return 'Your account has been created successfully. You can now sign in.'
      default:
        return null
    }
  }

  const errorMessage = getErrorMessage(error)
  const successMessage = getSuccessMessage(success)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start sm:items-center justify-center py-8 px-4 sm:px-6 sm:py-12 lg:px-8">
      <div className="w-full space-y-6 pb-4 sm:pb-0">
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
                <h3 className="text-sm font-medium text-green-800">Registration Successful</h3>
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
                <h3 className="text-sm font-medium text-red-800">Registration Error</h3>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <RegisterForm />
        
        {/* Additional Information */}
        <div className="max-w-md mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-blue-700 space-y-2">
                <h3 className="font-medium">What happens next?</h3>
                <ul className="space-y-1 text-xs">
                  <li>• We&apos;ll send a verification email to your inbox</li>
                  <li>• Click the verification link to activate your account</li>
                  <li>• Sign in with your email and password</li>
                  <li>• Start using your account immediately</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="max-w-md mx-auto text-center">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              By creating an account, you agree to our{' '}
              <a 
                href="/terms" 
                className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Privacy Policy
              </a>
              .
            </p>
            <p>
              Need help? Contact us at{' '}
              <a 
                href="mailto:support@example.com" 
                className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
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
      <RegisterContent />
    </Suspense>
  )
}

