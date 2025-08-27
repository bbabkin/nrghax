import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ProtectedRoute, withAuth, useProtectedRoute } from '../ProtectedRoute'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

// Mock UI components
jest.mock('../ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { ...props, ...children.props })
    }
    return <button {...props}>{children}</button>
  },
}))

// Mock window.location
const mockLocation = {
  pathname: '/protected-page',
  search: '?param=value',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.Mock
const mockUseSession = useSession as jest.Mock

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    role: 'user',
  },
  expires: '2024-12-31',
}

const mockUnverifiedSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: false,
    role: 'user',
  },
  expires: '2024-12-31',
}

const mockAdminSession = {
  user: {
    id: 'test-user-id',
    email: 'admin@example.com',
    name: 'Admin User',
    emailVerified: true,
    role: 'admin',
  },
  expires: '2024-12-31',
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading spinner when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we verify your access')).toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })

    it('shows custom fallback when provided during loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      const CustomFallback = () => <div>Custom loading...</div>

      render(
        <ProtectedRoute fallback={<CustomFallback />}>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Custom loading...')).toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    })

    it('applies custom className to loading state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(
        <ProtectedRoute className="custom-class">
          <div>Protected content</div>
        </ProtectedRoute>
      )

      const loadingContainer = screen.getByText('Loading...').closest('.min-h-screen')
      expect(loadingContainer).toHaveClass('custom-class')
    })
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('redirects to login page when not authenticated', async () => {
      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/login?redirect=%2Fprotected-page%3Fparam%3Dvalue'
        )
      })
    })

    it('redirects to custom redirectTo when not authenticated', async () => {
      render(
        <ProtectedRoute redirectTo="/custom-login">
          <div>Protected content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/custom-login?redirect=%2Fprotected-page%3Fparam%3Dvalue'
        )
      })
    })

    it('shows authentication required message when not redirecting', () => {
      // Simulate the state where redirection hasn't occurred yet
      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      expect(screen.getByText('You need to be signed in to access this page.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
      expect(screen.getByRole('link', { name: /go back home/i })).toHaveAttribute('href', '/')
    })

    it('shows custom fallback when not authenticated and fallback provided', () => {
      const CustomFallback = () => <div>Please log in</div>

      render(
        <ProtectedRoute fallback={<CustomFallback />}>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Please log in')).toBeInTheDocument()
      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    it('renders children when authenticated', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })

    it('applies custom className to authenticated content', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(
        <ProtectedRoute className="custom-class">
          <div>Protected content</div>
        </ProtectedRoute>
      )

      const container = screen.getByText('Protected content').parentElement
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Email Verification', () => {
    it('redirects to verify-email when verification is required but not verified', async () => {
      mockUseSession.mockReturnValue({
        data: mockUnverifiedSession,
        status: 'authenticated',
      })

      render(
        <ProtectedRoute requireVerified>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/verify-email')
      })
    })

    it('shows email verification required message when not redirecting', () => {
      mockUseSession.mockReturnValue({
        data: mockUnverifiedSession,
        status: 'authenticated',
      })

      render(
        <ProtectedRoute requireVerified>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
      expect(screen.getByText(/please verify your email address/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /verify email/i })).toHaveAttribute('href', '/verify-email')
      expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard')
    })

    it('renders children when email is verified', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(
        <ProtectedRoute requireVerified>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })

    it('shows custom fallback when verification required and fallback provided', () => {
      mockUseSession.mockReturnValue({
        data: mockUnverifiedSession,
        status: 'authenticated',
      })

      const CustomFallback = () => <div>Please verify your email</div>

      render(
        <ProtectedRoute requireVerified fallback={<CustomFallback />}>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Please verify your email')).toBeInTheDocument()
      expect(screen.queryByText('Email Verification Required')).not.toBeInTheDocument()
    })
  })

  describe('Role-based Access Control', () => {
    it('redirects to unauthorized when user lacks required role', async () => {
      mockUseSession.mockReturnValue({
        data: mockSession, // user role
        status: 'authenticated',
      })

      render(
        <ProtectedRoute allowedRoles={['admin', 'moderator']}>
          <div>Admin content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized')
      })
    })

    it('shows access denied message when user lacks required role', () => {
      mockUseSession.mockReturnValue({
        data: mockSession, // user role
        status: 'authenticated',
      })

      render(
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Admin content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText(/you don't have permission to access this page/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard')
      expect(screen.getByRole('link', { name: /go back home/i })).toHaveAttribute('href', '/')
    })

    it('renders children when user has required role', () => {
      mockUseSession.mockReturnValue({
        data: mockAdminSession,
        status: 'authenticated',
      })

      render(
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Admin content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Admin content')).toBeInTheDocument()
    })

    it('renders children when user has one of multiple allowed roles', () => {
      mockUseSession.mockReturnValue({
        data: mockSession, // user role
        status: 'authenticated',
      })

      render(
        <ProtectedRoute allowedRoles={['admin', 'user', 'moderator']}>
          <div>Multi-role content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Multi-role content')).toBeInTheDocument()
    })

    it('handles user without role property', async () => {
      const sessionWithoutRole = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          // no role property
        },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: sessionWithoutRole,
        status: 'authenticated',
      })

      render(
        <ProtectedRoute allowedRoles={['admin']}>
          <div>Admin content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized')
      })
    })

    it('shows custom fallback when role check fails and fallback provided', () => {
      mockUseSession.mockReturnValue({
        data: mockSession, // user role
        status: 'authenticated',
      })

      const CustomFallback = () => <div>Insufficient permissions</div>

      render(
        <ProtectedRoute allowedRoles={['admin']} fallback={<CustomFallback />}>
          <div>Admin content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Insufficient permissions')).toBeInTheDocument()
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
    })
  })

  describe('Combined Checks', () => {
    it('handles email verification and role checks together', () => {
      mockUseSession.mockReturnValue({
        data: mockAdminSession,
        status: 'authenticated',
      })

      render(
        <ProtectedRoute requireVerified allowedRoles={['admin']}>
          <div>Verified admin content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Verified admin content')).toBeInTheDocument()
    })

    it('shows verification message when email not verified even with correct role', () => {
      const unverifiedAdmin = {
        user: {
          id: 'test-user-id',
          email: 'admin@example.com',
          name: 'Admin User',
          emailVerified: false,
          role: 'admin',
        },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: unverifiedAdmin,
        status: 'authenticated',
      })

      render(
        <ProtectedRoute requireVerified allowedRoles={['admin']}>
          <div>Verified admin content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
    })
  })

  describe('Redirect URL Handling', () => {
    it('handles redirectTo with existing query parameters', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <ProtectedRoute redirectTo="/login?tab=signin">
          <div>Protected content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/login?tab=signin&redirect=%2Fprotected-page%3Fparam%3Dvalue'
        )
      })
    })

    it('handles current URL without search params', async () => {
      window.location = {
        ...mockLocation,
        search: '',
      } as any

      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/login?redirect=%2Fprotected-page'
        )
      })

      // Reset location
      window.location = mockLocation as any
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for loading state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      const spinnerIcon = screen.getByRole('generic').querySelector('[aria-hidden="true"]')
      expect(spinnerIcon).toBeInTheDocument()
    })

    it('has proper focus management for interactive elements', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2')
      })
    })

    it('provides meaningful text for screen readers', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      expect(screen.getByText('You need to be signed in to access this page.')).toBeInTheDocument()
    })
  })
})

describe('withAuth HOC', () => {
  const TestComponent = ({ message }: { message: string }) => (
    <div>Test Component: {message}</div>
  )

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
    })
    jest.clearAllMocks()
  })

  it('wraps component with ProtectedRoute', () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const ProtectedTestComponent = withAuth(TestComponent)
    
    render(<ProtectedTestComponent message="Hello" />)

    expect(screen.getByText('Test Component: Hello')).toBeInTheDocument()
  })

  it('passes props to wrapped component', () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const ProtectedTestComponent = withAuth(TestComponent, { requireVerified: true })
    
    render(<ProtectedTestComponent message="Test Message" />)

    expect(screen.getByText('Test Component: Test Message')).toBeInTheDocument()
  })

  it('applies protection options to wrapped component', async () => {
    mockUseSession.mockReturnValue({
      data: mockUnverifiedSession,
      status: 'authenticated',
    })

    const ProtectedTestComponent = withAuth(TestComponent, { requireVerified: true })
    
    render(<ProtectedTestComponent message="Hello" />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/verify-email')
    })
  })

  it('sets proper display name', () => {
    const ProtectedTestComponent = withAuth(TestComponent)
    expect(ProtectedTestComponent.displayName).toBe('withAuth(TestComponent)')
  })

  it('handles component without display name', () => {
    const AnonymousComponent = () => <div>Anonymous</div>
    const ProtectedAnonymousComponent = withAuth(AnonymousComponent)
    expect(ProtectedAnonymousComponent.displayName).toBe('withAuth(AnonymousComponent)')
  })
})

describe('useProtectedRoute hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const TestHookComponent = (props: Parameters<typeof useProtectedRoute>[0]) => {
    const { isAuthorized, isLoading, error, session } = useProtectedRoute(props)
    
    return (
      <div>
        <div data-testid="is-authorized">{isAuthorized.toString()}</div>
        <div data-testid="is-loading">{isLoading.toString()}</div>
        <div data-testid="error">{error || 'null'}</div>
        <div data-testid="session">{session ? 'has session' : 'no session'}</div>
      </div>
    )
  }

  it('returns loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    })

    render(<TestHookComponent />)

    expect(screen.getByTestId('is-authorized')).toHaveTextContent('false')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
    expect(screen.getByTestId('session')).toHaveTextContent('no session')
  })

  it('returns unauthorized state when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<TestHookComponent />)

    expect(screen.getByTestId('is-authorized')).toHaveTextContent('false')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('Authentication required')
    expect(screen.getByTestId('session')).toHaveTextContent('no session')
  })

  it('returns authorized state when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    render(<TestHookComponent />)

    expect(screen.getByTestId('is-authorized')).toHaveTextContent('true')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
    expect(screen.getByTestId('session')).toHaveTextContent('has session')
  })

  it('returns error when email verification required but not verified', () => {
    mockUseSession.mockReturnValue({
      data: mockUnverifiedSession,
      status: 'authenticated',
    })

    render(<TestHookComponent requireVerified />)

    expect(screen.getByTestId('is-authorized')).toHaveTextContent('false')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('Email verification required')
    expect(screen.getByTestId('session')).toHaveTextContent('has session')
  })

  it('returns error when user lacks required role', () => {
    mockUseSession.mockReturnValue({
      data: mockSession, // user role
      status: 'authenticated',
    })

    render(<TestHookComponent allowedRoles={['admin']} />)

    expect(screen.getByTestId('is-authorized')).toHaveTextContent('false')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('Insufficient permissions')
    expect(screen.getByTestId('session')).toHaveTextContent('has session')
  })

  it('returns authorized when user has required role', () => {
    mockUseSession.mockReturnValue({
      data: mockAdminSession,
      status: 'authenticated',
    })

    render(<TestHookComponent allowedRoles={['admin']} />)

    expect(screen.getByTestId('is-authorized')).toHaveTextContent('true')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
    expect(screen.getByTestId('session')).toHaveTextContent('has session')
  })

  it('handles combined checks correctly', () => {
    mockUseSession.mockReturnValue({
      data: mockAdminSession,
      status: 'authenticated',
    })

    render(<TestHookComponent requireVerified allowedRoles={['admin']} />)

    expect(screen.getByTestId('is-authorized')).toHaveTextContent('true')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
    expect(screen.getByTestId('session')).toHaveTextContent('has session')
  })
})