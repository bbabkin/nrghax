import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'
import { AlertCircle, Loader2 } from 'lucide-react'

interface LoginPageProps {
  searchParams: {
    error?: string
    redirect?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectUrl = searchParams.redirect || '/dashboard'
  const error = searchParams.error

  const getErrorMessage = (error: string | undefined) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'EmailNotVerified':
        return 'Please verify your email address before signing in. Check your inbox for the verification link.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification link is invalid or has expired. Please try signing in again.'
      case 'OAuthSignin':
      case 'OAuthCallback':
        return 'There was an error with the OAuth sign-in process. Please try again.'
      case 'Configuration':
        return 'There is a problem with the server configuration. Please contact support.'
      default:
        return error ? 'An error occurred during sign-in. Please try again.' : null
    }
  }

  const errorMessage = getErrorMessage(error)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start sm:items-center justify-center py-8 px-4 sm:px-6 sm:py-12 lg:px-8">
      <div className="w-full space-y-6 pb-4 sm:pb-0">
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
                <h3 className="text-sm font-medium text-red-800">Sign-in Error</h3>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <Suspense 
          fallback={
            <div className="max-w-md mx-auto flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          }
        >
          <AuthForm 
            view="sign_in" 
            redirectTo={redirectUrl}
            showLinks={true}
            providers={['google', 'discord']}
          />
        </Suspense>
        
        {/* Help Text */}
        <div className="max-w-md mx-auto text-center">
          <div className="text-sm text-gray-600">
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