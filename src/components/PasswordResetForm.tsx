'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const resetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

type ResetFormData = z.infer<typeof resetSchema>

interface PasswordResetFormProps {
  className?: string
}

export function PasswordResetForm({ className = '' }: PasswordResetFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: ResetFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        switch (result.error) {
          case 'UserNotFound':
            // For security reasons, we still show success even if user doesn't exist
            setSuccess(true)
            setEmailSent(data.email)
            break
          case 'InvalidEmail':
            setError('Please enter a valid email address.')
            break
          case 'RateLimitExceeded':
            setError('Too many password reset requests. Please wait a few minutes before trying again.')
            break
          case 'EmailServiceError':
            setError('Unable to send reset email at this time. Please try again later.')
            break
          default:
            setError(result.message || 'An error occurred while sending the reset email. Please try again.')
        }
        return
      }

      // Reset request successful
      setSuccess(true)
      setEmailSent(data.email)
    } catch (error) {
      console.error('Password reset error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    const email = getValues('email')
    if (!email) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        if (result.error === 'RateLimitExceeded') {
          setError('Please wait a few minutes before requesting another reset email.')
        } else {
          setError('Failed to resend email. Please try again.')
        }
      }
    } catch (error) {
      console.error('Resend email error:', error)
      setError('Failed to resend email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className={`w-full max-w-md mx-auto ${className}`}>
        <div className="bg-white rounded-lg shadow-md border p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="text-gray-600">
                We've sent password reset instructions to{' '}
                <span className="font-medium text-gray-900">{emailSent}</span>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-left">
              <div className="flex items-start space-x-2">
                <Mail className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm text-blue-700 space-y-1">
                  <p className="font-medium">What's next?</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Check your email inbox (and spam folder)</li>
                    <li>• Click the reset link in the email</li>
                    <li>• Create your new password</li>
                    <li>• Sign in with your new password</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert for resend operations */}
          {error && (
            <div 
              role="alert" 
              className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md"
              aria-live="polite"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or
              </p>
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Resending...
                  </>
                ) : (
                  'Resend email'
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-4 border-t">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                <ArrowLeft className="mr-1 h-3 w-3" aria-hidden="true" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-md border p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div 
            role="alert" 
            className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md"
            aria-live="polite"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email Field */}
          <div className="space-y-1">
            <Label 
              htmlFor="reset-email" 
              className="text-sm font-medium text-gray-700"
            >
              Email address *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                className={`pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter your email address"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : 'email-help'}
                {...register('email')}
              />
            </div>
            {errors.email ? (
              <p 
                id="email-error" 
                role="alert" 
                className="text-sm text-red-600 flex items-center space-x-1"
              >
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                <span>{errors.email.message}</span>
              </p>
            ) : (
              <p id="email-help" className="text-xs text-gray-500">
                We'll send password reset instructions to this email
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isSubmitting}
          >
            {(isLoading || isSubmitting) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Sending reset link...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>

        {/* Security Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-medium">Security notice</p>
              <p>
                For your security, password reset links expire after 1 hour and can only be used once.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="flex items-center justify-center space-x-2 pt-2 border-t">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
          >
            <ArrowLeft className="mr-1 h-3 w-3" aria-hidden="true" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}