import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { RegisterForm } from '../RegisterForm'

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

// Mock fetch
global.fetch = jest.fn()

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSignIn = signIn as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockFetch = global.fetch as jest.Mock

describe('RegisterForm', () => {
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
    it('renders registration form with all required fields', () => {
      render(<RegisterForm />)

      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
      expect(screen.getByText(/get started with your free account today/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument()
    })

    it('renders terms and privacy policy links', () => {
      render(<RegisterForm />)
      
      expect(screen.getByText(/by creating an account, you agree/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms')
      expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy')
    })

    it('renders sign in link', () => {
      render(<RegisterForm />)
      
      const signInLink = screen.getByRole('link', { name: /sign in/i })
      expect(signInLink).toBeInTheDocument()
      expect(signInLink).toHaveAttribute('href', '/login')
    })

    it('applies custom className when provided', () => {
      const customClass = 'custom-test-class'
      render(<RegisterForm className={customClass} />)
      
      const container = screen.getByRole('heading', { name: /create your account/i }).closest('.w-full')
      expect(container).toHaveClass(customClass)
    })
  })

  describe('Form Validation', () => {
    it('shows validation error for empty name', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      await user.click(nameInput)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i)
      })
    })

    it('shows validation error for name too short', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, 'A')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/name must be at least 2 characters/i)
      })
    })

    it('shows validation error for name with invalid characters', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, 'John123')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/name can only contain letters and spaces/i)
      })
    })

    it('shows validation error for empty email', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.click(emailInput)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i)
      })
    })

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/please enter a valid email address/i)
      })
    })

    it('shows validation error for empty password', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      await user.click(passwordInput)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/password is required/i)
      })
    })

    it('shows validation error for password too short', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      await user.type(passwordInput, 'Test1')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/password must be at least 8 characters/i)
      })
    })

    it('shows validation error for weak password', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      await user.type(passwordInput, 'testpassword')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/password must contain at least one lowercase letter, one uppercase letter, and one number/i)
      })
    })

    it('shows validation error for empty confirm password', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      await user.click(confirmPasswordInput)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/please confirm your password/i)
      })
    })

    it('shows validation error when passwords do not match', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(passwordInput, 'TestPassword123')
      await user.type(confirmPasswordInput, 'DifferentPassword123')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/passwords don't match/i)
      })
    })

    it('validates form correctly with valid input', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(passwordInput, 'TestPassword123')
      await user.type(confirmPasswordInput, 'TestPassword123')
      
      // No validation errors should be shown
      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/please confirm your password/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Password Strength Indicator', () => {
    it('shows password strength indicator when password is entered', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      await user.type(passwordInput, 'Test')
      
      await waitFor(() => {
        expect(screen.getByText('Weak')).toBeInTheDocument()
      })
    })

    it('updates strength indicator based on password complexity', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      
      // Weak password
      await user.type(passwordInput, 'test123')
      await waitFor(() => {
        expect(screen.getByText('Weak')).toBeInTheDocument()
      })

      // Medium password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'Test123')
      await waitFor(() => {
        expect(screen.getByText('Medium')).toBeInTheDocument()
      })

      // Strong password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'Test123A')
      await waitFor(() => {
        expect(screen.getByText('Strong')).toBeInTheDocument()
      })
    })

    it('does not show strength indicator when password is empty', () => {
      render(<RegisterForm />)
      
      expect(screen.queryByText('Weak')).not.toBeInTheDocument()
      expect(screen.queryByText('Medium')).not.toBeInTheDocument()
      expect(screen.queryByText('Strong')).not.toBeInTheDocument()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const passwordInput = screen.getByLabelText(/^password/i)
      const toggleButton = screen.getByRole('button', { name: /show password/i })

      expect(passwordInput).toHaveAttribute('type', 'password')
      
      await user.click(toggleButton)
      
      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
    })

    it('toggles confirm password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const toggleButton = screen.getByRole('button', { name: /show password confirmation/i })

      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      
      await user.click(toggleButton)
      
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: /hide password confirmation/i })).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    const validFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'TestPassword123',
      confirmPassword: 'TestPassword123'
    }

    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, validFormData.name)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.confirmPassword)
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: validFormData.name,
            email: validFormData.email,
            password: validFormData.password,
          }),
        })
      })
    })

    it('shows success screen after successful registration', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, validFormData.name)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.confirmPassword)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
        expect(screen.getByText(/we've sent a verification link/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /back to registration/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /already verified\? sign in/i })).toBeInTheDocument()
      })
    })

    it('can return to registration form from success screen', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      })
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      // Fill and submit form
      await user.type(nameInput, validFormData.name)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.confirmPassword)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
      })

      // Click back to registration
      const backButton = screen.getByRole('button', { name: /back to registration/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
      })
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      let resolveSubmit: (value: any) => void
      mockFetch.mockReturnValue(new Promise(resolve => {
        resolveSubmit = resolve
      }))
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, validFormData.name)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.confirmPassword)
      await user.click(submitButton)

      expect(screen.getByText(/creating account.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Resolve the promise
      resolveSubmit!({
        ok: true,
        json: async () => ({ success: true })
      })

      await waitFor(() => {
        expect(screen.queryByText(/creating account.../i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    const validFormData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'TestPassword123',
      confirmPassword: 'TestPassword123'
    }

    it('displays error for existing user', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'UserAlreadyExists' })
      })
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, validFormData.name)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.confirmPassword)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/an account with this email already exists/i)
      })
    })

    it('displays error for rate limit exceeded', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'RateLimitExceeded' })
      })
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, validFormData.name)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.confirmPassword)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/too many registration attempts/i)
      })
    })

    it('displays generic error for unknown errors', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'UnknownError', message: 'Something went wrong' })
      })
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, validFormData.name)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.confirmPassword)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
      })
    })

    it('handles fetch rejection', async () => {
      const user = userEvent.setup()
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, validFormData.name)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.confirmPassword)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/an unexpected error occurred/i)
      })
    })

    it('clears error when form is resubmitted', async () => {
      const user = userEvent.setup()
      
      // First submission fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'UserAlreadyExists' })
      })
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, validFormData.name)
      await user.type(emailInput, validFormData.email)
      await user.type(passwordInput, validFormData.password)
      await user.type(confirmPasswordInput, validFormData.confirmPassword)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/an account with this email already exists/i)
      })

      // Second submission succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      
      await user.clear(emailInput)
      await user.type(emailInput, 'different@example.com')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/an account with this email already exists/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Google Sign Up', () => {
    it('initiates Google sign up when button is clicked', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValue({ ok: true })
      
      render(<RegisterForm />)

      const googleButton = screen.getByRole('button', { name: /sign up with google/i })
      await user.click(googleButton)

      expect(mockSignIn).toHaveBeenCalledWith('google', { 
        callbackUrl: '/dashboard' 
      })
    })

    it('handles Google sign up errors', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValue(new Error('Google sign up failed'))
      
      render(<RegisterForm />)

      const googleButton = screen.getByRole('button', { name: /sign up with google/i })
      await user.click(googleButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/google sign-up failed/i)
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      expect(nameInput).toHaveAttribute('aria-invalid', 'false')
      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
      expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'false')
    })

    it('updates ARIA attributes when validation fails', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)

      await user.click(nameInput)
      await user.tab()

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
        expect(nameInput).toHaveAttribute('aria-describedby', 'name-error')
      })
    })

    it('has live region for errors', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'UserAlreadyExists' })
      })
      
      render(<RegisterForm />)

      const nameInput = screen.getByLabelText(/full name/i)
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/^password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole('button', { name: /create account/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(passwordInput, 'TestPassword123')
      await user.type(confirmPasswordInput, 'TestPassword123')
      await user.click(submitButton)

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert')
        expect(errorAlert).toHaveAttribute('aria-live', 'polite')
      })
    })
  })
})