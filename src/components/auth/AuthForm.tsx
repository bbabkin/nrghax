'use client'

import React from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createSupabaseClient } from '@/lib/supabase/client'

interface AuthFormProps {
  view?: 'sign_in' | 'sign_up' | 'forgotten_password' | 'magic_link' | 'update_password'
  redirectTo?: string
  showLinks?: boolean
  onlyThirdPartyProviders?: boolean
  providers?: Array<'google' | 'discord'>
  className?: string
}

export function AuthForm({
  view = 'sign_in',
  redirectTo,
  showLinks = true,
  onlyThirdPartyProviders = false,
  providers = ['google', 'discord'],
  className = '',
}: AuthFormProps) {
  const supabase = createSupabaseClient()

  // Get the redirect URL based on environment
  const getRedirectUrl = () => {
    if (redirectTo) return redirectTo
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`
    }
    return '/auth/callback'
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-md border p-6">
        <div className="text-center space-y-2 mb-6">
          {view === 'sign_in' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-600">Sign in to your account to continue</p>
            </>
          )}
          {view === 'sign_up' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
              <p className="text-gray-600">Sign up to get started</p>
            </>
          )}
          {view === 'forgotten_password' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
              <p className="text-gray-600">Enter your email to reset your password</p>
            </>
          )}
        </div>

        <Auth
          supabaseClient={supabase as any}
          view={view}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6',
                  brandAccent: '#2563eb',
                  brandButtonText: 'white',
                  defaultButtonBackground: '#f3f4f6',
                  defaultButtonBackgroundHover: '#e5e7eb',
                  defaultButtonBorder: '#d1d5db',
                  defaultButtonText: '#374151',
                  dividerBackground: '#e5e7eb',
                  inputBackground: 'white',
                  inputBorder: '#d1d5db',
                  inputBorderHover: '#9ca3af',
                  inputBorderFocus: '#3b82f6',
                  inputText: '#111827',
                  inputLabelText: '#374151',
                  inputPlaceholder: '#9ca3af',
                  messageText: '#dc2626',
                  messageTextDanger: '#dc2626',
                  anchorTextColor: '#3b82f6',
                  anchorTextHoverColor: '#2563eb',
                },
                space: {
                  spaceSmall: '4px',
                  spaceMedium: '8px',
                  spaceLarge: '16px',
                  labelBottomMargin: '4px',
                  anchorBottomMargin: '4px',
                  emailInputSpacing: '4px',
                  socialAuthSpacing: '4px',
                  buttonPadding: '8px 16px',
                  inputPadding: '8px 12px',
                },
                fontSizes: {
                  baseBodySize: '14px',
                  baseInputSize: '14px',
                  baseLabelSize: '14px',
                  baseButtonSize: '14px',
                },
                fonts: {
                  bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '6px',
                  buttonBorderRadius: '6px',
                  inputBorderRadius: '6px',
                },
              },
            },
            style: {
              button: {
                fontWeight: '500',
                transition: 'all 0.2s ease',
              },
              anchor: {
                fontWeight: '500',
                textDecoration: 'none',
              },
              input: {
                transition: 'all 0.2s ease',
              },
              label: {
                fontWeight: '500',
              },
              message: {
                fontSize: '14px',
                fontWeight: '400',
              },
            },
            className: {
              container: 'space-y-4',
              button: 'w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
              input: 'w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
              label: 'block text-sm font-medium text-gray-700',
              anchor: 'text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded',
              divider: 'my-4',
              message: 'mt-1 text-sm',
            },
          }}
          providers={onlyThirdPartyProviders ? providers : providers}
          onlyThirdPartyProviders={onlyThirdPartyProviders}
          redirectTo={getRedirectUrl()}
          showLinks={showLinks}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Password',
                email_input_placeholder: 'Enter your email',
                password_input_placeholder: 'Enter your password',
                button_label: 'Sign in',
                loading_button_label: 'Signing in...',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: "Don't have an account? Sign up",
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Password',
                email_input_placeholder: 'Enter your email',
                password_input_placeholder: 'Create a password',
                button_label: 'Sign up',
                loading_button_label: 'Signing up...',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: 'Already have an account? Sign in',
              },
              forgotten_password: {
                email_label: 'Email address',
                email_input_placeholder: 'Enter your email',
                button_label: 'Send reset instructions',
                loading_button_label: 'Sending...',
                link_text: 'Back to sign in',
                confirmation_text: 'Check your email for reset instructions',
              },
            },
          }}
          theme="light"
        />
      </div>
    </div>
  )
}