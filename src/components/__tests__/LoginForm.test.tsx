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

jest.mock('../ui/input', () => ({
  Input: React.forwardRef((props: any, ref: any) => <input {...props} ref={ref} />),
}))

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
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
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
})