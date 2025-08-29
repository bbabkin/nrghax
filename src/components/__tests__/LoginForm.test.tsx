import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LoginForm } from '../LoginForm'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

// Mock UI components
jest.mock('../ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock('../ui/input', () => {
  const MockInput = React.forwardRef((props: any, ref: any) => <input {...props} ref={ref} />)
  MockInput.displayName = 'MockInput'
  return { Input: MockInput }
})

jest.mock('../ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSignIn = signIn as jest.Mock
const mockUseRouter = useRouter as jest.Mock

describe('LoginForm', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Rendering', () => {
    it('renders login form with all required fields', () => {
      render(<LoginForm />)

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByText(/sign in to your account to continue/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password \*/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    })

    it('renders forgot password link', () => {
      render(<LoginForm />)
      
      const forgotPasswordLink = screen.getByRole('link', { name: /forgot your password/i })
      expect(forgotPasswordLink).toBeInTheDocument()
      expect(forgotPasswordLink).toHaveAttribute('href', '/reset-password')
    })

    it('renders sign up link', () => {
      render(<LoginForm />)
      
      const signUpLink = screen.getByRole('link', { name: /sign up/i })
      expect(signUpLink).toBeInTheDocument()
      expect(signUpLink).toHaveAttribute('href', '/register')
    })

    it('applies custom className when provided', () => {
      const customClass = 'custom-test-class'
      render(<LoginForm className={customClass} />)
      
      const container = screen.getByRole('heading', { name: /welcome back/i }).closest('.w-full')
      expect(container).toHaveClass(customClass)
    })
  })

  describe('Form Validation', () => {
    it('shows validation error for empty email', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.click(emailInput)
      await user.tab() // Blur the field to trigger validation
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i)
      })

      // Form should not submit
      await user.click(submitButton)
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)

      await user.type(emailInput, 'invalid-email')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/please enter a valid email address/i)
      })
    })

    it('shows validation error for empty password', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/^password/i)

      await user.click(passwordInput)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/password is required/i)
      })
    })

    it('shows validation error for password too short', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/^password/i)

      await user.type(passwordInput, '123')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/password must be at least 6 characters/i)
      })
    })

    it('validates form correctly with valid input', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      // No validation errors should be shown
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      const toggleButton = screen.getByRole('button', { name: /show password/i })

      expect(passwordInput).toHaveAttribute('type', 'password')
      
      await user.click(toggleButton)
      
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
      
      await user.click(toggleButton)
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid credentials', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ ok: true, error: null })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        })
      })

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })

    it('redirects to custom URL when provided', async () => {
      const user = userEvent.setup()
      const customRedirectUrl = '/custom-dashboard'
      mockSignIn.mockResolvedValue({ ok: true, error: null })
      
      render(<LoginForm redirectUrl={customRedirectUrl} />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled()
      })

      expect(mockPush).toHaveBeenCalledWith(customRedirectUrl)
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      let resolveSignIn: (value: any) => void
      mockSignIn.mockReturnValue(new Promise(resolve => {
        resolveSignIn = resolve
      }))
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(screen.getByText(/signing in.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Resolve the promise
      resolveSignIn!({ ok: true, error: null })

      await waitFor(() => {
        expect(screen.queryByText(/signing in.../i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error for invalid credentials', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'CredentialsSignin' 
      })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i)
      })

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('displays error for email not verified', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'EmailNotVerified' 
      })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/please verify your email address/i)
      })
    })

    it('displays error for too many attempts', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'TooManyAttempts' 
      })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/too many login attempts/i)
      })
    })

    it('displays generic error for unexpected errors', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'UnknownError' 
      })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/an unexpected error occurred/i)
      })
    })

    it('handles signIn promise rejection', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Network error'))
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/an unexpected error occurred/i)
      })
    })

    it('clears error when form is resubmitted', async () => {
      const user = userEvent.setup()
      
      // First submission fails
      mockSignIn.mockResolvedValueOnce({ 
        ok: false, 
        error: 'CredentialsSignin' 
      })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i)
      })

      // Second submission succeeds
      mockSignIn.mockResolvedValueOnce({ ok: true, error: null })
      
      await user.clear(passwordInput)
      await user.type(passwordInput, 'correctpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Google Sign In', () => {
    it('initiates Google sign in when button is clicked', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ ok: true })
      
      render(<LoginForm />)

      const googleButton = screen.getByRole('button', { name: /sign in with google/i })
      await user.click(googleButton)

      expect(mockSignIn).toHaveBeenCalledWith('google', { 
        callbackUrl: '/dashboard' 
      })
    })

    it('uses custom redirect URL for Google sign in', async () => {
      const user = userEvent.setup()
      const customRedirectUrl = '/custom-dashboard'
      mockSignIn.mockResolvedValue({ ok: true })
      
      render(<LoginForm redirectUrl={customRedirectUrl} />)

      const googleButton = screen.getByRole('button', { name: /sign in with google/i })
      await user.click(googleButton)

      expect(mockSignIn).toHaveBeenCalledWith('google', { 
        callbackUrl: customRedirectUrl 
      })
    })

    it('handles Google sign in errors', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Google sign in failed'))
      
      render(<LoginForm />)

      const googleButton = screen.getByRole('button', { name: /sign in with google/i })
      await user.click(googleButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/google sign-in failed/i)
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-help')
    })

    it('updates ARIA attributes when validation fails', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)

      await user.click(emailInput)
      await user.tab()

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
      })
    })

    it('announces errors with role="alert"', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)

      await user.click(emailInput)
      await user.tab()

      await waitFor(() => {
        const errorElement = screen.getByRole('alert')
        expect(errorElement).toHaveTextContent(/email is required/i)
      })
    })

    it('has live region for general errors', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'CredentialsSignin' 
      })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('allows navigation through form elements with Tab key', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const toggleButton = screen.getByRole('button', { name: /show password/i })
      const forgotPasswordLink = screen.getByRole('link', { name: /forgot your password/i })
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.tab()
      expect(emailInput).toHaveFocus()

      await user.tab()
      expect(passwordInput).toHaveFocus()

      await user.tab()
      expect(toggleButton).toHaveFocus()

      await user.tab()
      expect(forgotPasswordLink).toHaveFocus()

      await user.tab()
      expect(submitButton).toHaveFocus()
    })

    it('submits form on Enter key press', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ ok: true, error: null })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled()
      })
    })
  })

  // PHASE 1 TDD RED TESTS - These should FAIL initially
  // These tests define the expected behavior when the form is working properly
  describe('Form POST Method Tests (SHOULD FAIL INITIALLY)', () => {
    it('should submit form as POST request, not GET', async () => {
      // This test should fail - currently forms submit as GET requests
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ ok: true, error: null })
      
      render(<LoginForm />)

      const form = screen.getByRole('form') || document.querySelector('form')
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      // Verify form has correct method attribute
      expect(form).toHaveAttribute('method', 'post')

      await user.type(emailInput, 'admin@test.com')
      await user.type(passwordInput, 'AdminPassword123!')
      
      // Monitor form submission
      const submitSpy = jest.fn()
      form?.addEventListener('submit', submitSpy)
      
      await user.click(submitButton)

      // Verify form submitted and called signIn
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'admin@test.com',
          password: 'AdminPassword123!',
          redirect: false,
        })
      })
    })

    it('should prevent default form submission and use NextAuth signIn', async () => {
      // This should fail - form may submit as HTML form instead of using signIn
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ ok: true, error: null })
      
      render(<LoginForm />)

      const form = screen.getByRole('form') || document.querySelector('form')
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'user1@test.com')
      await user.type(passwordInput, 'UserPassword123!')

      // Spy on form's default submission to ensure preventDefault is called
      let preventDefaultCalled = false
      const originalPreventDefault = Event.prototype.preventDefault
      jest.spyOn(Event.prototype, 'preventDefault').mockImplementation(function() {
        preventDefaultCalled = true
        originalPreventDefault.call(this)
      })

      await user.click(submitButton)

      // Verify NextAuth signIn was called instead of default form submission
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'user1@test.com',
          password: 'UserPassword123!',
          redirect: false,
        })
      })
      
      // Default submission should be prevented
      expect(preventDefaultCalled).toBe(true)
      
      // Restore preventDefault
      Event.prototype.preventDefault.mockRestore()
    })

    it('should handle form data properly with seeded test users', async () => {
      // This should fail - form submission with actual test user data
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ ok: true, error: null })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      // Test with seeded admin user
      await user.type(emailInput, 'admin@test.com')
      await user.type(passwordInput, 'Admin123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'admin@test.com',
          password: 'Admin123!',
          redirect: false,
        })
      })

      expect(mockPush).toHaveBeenCalledWith('/admin')
      expect(mockRefresh).toHaveBeenCalled()

      // Clear mocks and test regular user
      jest.clearAllMocks()
      mockSignIn.mockResolvedValue({ ok: true, error: null })

      await user.clear(emailInput)
      await user.clear(passwordInput)
      
      await user.type(emailInput, 'user1@test.com')
      await user.type(passwordInput, 'User123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'user1@test.com',
          password: 'User123!',
          redirect: false,
        })
      })
    })

    it('should redirect admin users to admin area after login', async () => {
      // This should fail - admin role-based redirection not implemented
      const user = userEvent.setup()
      
      // Mock signIn to return admin user session info
      mockSignIn.mockResolvedValue({ 
        ok: true, 
        error: null,
        user: { role: 'admin', email: 'admin@test.com' }
      })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'admin@test.com')
      await user.type(passwordInput, 'Admin123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'admin@test.com',
          password: 'Admin123!',
          redirect: false,
        })
      })

      // Admin should be redirected to admin area, not regular dashboard
      expect(mockPush).toHaveBeenCalledWith('/admin')
      expect(mockRefresh).toHaveBeenCalled()
    })

    it('should validate required fields before submission', async () => {
      // This should fail - client-side validation before API call
      const user = userEvent.setup()
      
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      // Try to submit empty form
      await user.click(submitButton)

      // Should show validation errors and NOT call signIn
      await waitFor(() => {
        expect(screen.getAllByRole('alert')).toHaveLength(2) // Email and password errors
      })
      
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('should handle authentication errors from server properly', async () => {
      // This should fail - proper error handling from auth system
      const user = userEvent.setup()
      
      // Mock different authentication error scenarios
      const authErrors = [
        { error: 'CredentialsSignin', expected: /invalid email or password/i },
        { error: 'EmailNotVerified', expected: /please verify your email address/i },
        { error: 'TooManyAttempts', expected: /too many login attempts/i },
        { error: 'AccountDisabled', expected: /account has been disabled/i }
      ]

      for (const { error, expected } of authErrors) {
        mockSignIn.mockResolvedValue({ ok: false, error })
        
        render(<LoginForm />)

        const emailInput = screen.getByLabelText(/email address/i)
        const passwordInput = screen.getByLabelText(/^password/i)
        const submitButton = screen.getByRole('button', { name: /sign in$/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByRole('alert')).toHaveTextContent(expected)
        })

        // Clean up for next iteration
        document.body.innerHTML = ''
        jest.clearAllMocks()
      }
    })
  })

  describe('Authentication Integration Tests (SHOULD FAIL INITIALLY)', () => {
    it('should complete full authentication flow with session creation', async () => {
      // This should fail - complete integration with session management
      const user = userEvent.setup()
      
      // Mock successful authentication and session creation
      mockSignIn.mockImplementation(async (provider, credentials) => {
        if (provider === 'credentials' && credentials?.email === 'user1@test.com') {
          // Simulate session being created after successful auth
          return { ok: true, error: null, session: { 
            user: { 
              id: 'user-123',
              email: 'user1@test.com', 
              role: 'user' 
            }
          }}
        }
        return { ok: false, error: 'CredentialsSignin' }
      })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'user1@test.com')
      await user.type(passwordInput, 'User123!')
      await user.click(submitButton)

      // Verify complete flow
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          email: 'user1@test.com',
          password: 'User123!',
          redirect: false,
        })
      })

      // Should redirect and refresh to ensure session is established
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })

    it('should handle OAuth flow integration', async () => {
      // This should fail - Google OAuth integration
      const user = userEvent.setup()
      
      mockSignIn.mockImplementation(async (provider, options) => {
        if (provider === 'google') {
          // Simulate OAuth redirect flow
          return { ok: true, url: 'http://localhost:3002/api/auth/callback/google' }
        }
        return { ok: false, error: 'OAuthSignin' }
      })
      
      render(<LoginForm />)

      const googleButton = screen.getByRole('button', { name: /sign in with google/i })
      await user.click(googleButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', { 
          callbackUrl: '/dashboard' 
        })
      })

      // OAuth flow should not call router push (handled by NextAuth)
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should persist authentication state across page reloads', async () => {
      // This should fail - session persistence testing
      const user = userEvent.setup()
      
      mockSignIn.mockResolvedValue({ ok: true, error: null })
      
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const submitButton = screen.getByRole('button', { name: /sign in$/i })

      await user.type(emailInput, 'admin@test.com')
      await user.type(passwordInput, 'Admin123!')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled()
      })

      // After successful login, refresh should be called to ensure session persistence
      expect(mockRefresh).toHaveBeenCalled()
      
      // Should redirect to appropriate page (admin@test.com goes to /admin)
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })
})