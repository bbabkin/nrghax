'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Home, Mail } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorDetails = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There is a problem with the authentication configuration. Our team has been notified.',
          details: 'This usually happens when OAuth providers are not properly configured or database connections are unavailable.',
        }
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in.',
          details: 'Your account may be restricted or pending approval.',
        }
      case 'Verification':
        return {
          title: 'Verification Failed',
          message: 'The verification link is invalid or has expired.',
          details: 'Please request a new verification email or try signing in again.',
        }
      case 'OAuthSignin':
        return {
          title: 'OAuth Sign-in Error',
          message: 'Failed to initiate OAuth sign-in process.',
          details: 'There may be an issue with the OAuth provider. Please try again or use a different sign-in method.',
        }
      case 'OAuthCallback':
        return {
          title: 'OAuth Callback Error',
          message: 'Failed to complete OAuth authentication.',
          details: 'The OAuth provider returned an error. Please try signing in again.',
        }
      case 'OAuthCreateAccount':
        return {
          title: 'Account Creation Failed',
          message: 'Unable to create an account with the OAuth provider.',
          details: 'There may be an existing account with this email. Try signing in with email and password instead.',
        }
      case 'EmailCreateAccount':
        return {
          title: 'Email Account Error',
          message: 'Unable to create an account with this email.',
          details: 'This email may already be registered. Try signing in instead.',
        }
      case 'Callback':
        return {
          title: 'Authentication Callback Error',
          message: 'There was an error during the authentication process.',
          details: 'Please clear your browser cookies and try again.',
        }
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          message: 'This OAuth account is not linked to any user.',
          details: 'To link this account, sign in with your existing credentials first.',
        }
      case 'EmailSignin':
        return {
          title: 'Email Sign-in Failed',
          message: 'Unable to send sign-in email.',
          details: 'Please check your email address and try again.',
        }
      case 'CredentialsSignin':
        return {
          title: 'Sign-in Failed',
          message: 'Invalid email or password.',
          details: 'Please check your credentials and try again.',
        }
      case 'SessionRequired':
        return {
          title: 'Session Required',
          message: 'You must be signed in to access this page.',
          details: 'Please sign in and try again.',
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          details: error || 'Please try again or contact support if the problem persists.',
        }
    }
  }

  const errorDetails = getErrorDetails(error)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
            {errorDetails.title}
          </h1>
          <p className="mt-2 text-base text-gray-600">
            {errorDetails.message}
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
            {errorDetails.details}
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try signing in again
          </Link>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to homepage
          </Link>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a
              href="mailto:support@example.com"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              <Mail className="inline h-4 w-4 mr-1" />
              Contact support
            </a>
          </p>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <p className="text-xs text-gray-500 font-mono">
              Error code: {error}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}