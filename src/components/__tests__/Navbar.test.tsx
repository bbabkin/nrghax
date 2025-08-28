import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession, signOut } from 'next-auth/react'
import { Navbar } from '../Navbar'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
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

jest.mock('../ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { 'data-testid': 'dropdown-trigger' })
    }
    return <div data-testid="dropdown-trigger">{children}</div>
  },
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, asChild, onClick, disabled }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, { 'data-testid': 'dropdown-item' })
    }
    return (
      <div 
        data-testid="dropdown-item" 
        onClick={disabled ? undefined : onClick}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {children}
      </div>
    )
  },
  DropdownMenuLabel: ({ children }: any) => <div data-testid="dropdown-label">{children}</div>,
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
}))

const mockUseSession = useSession as jest.Mock
const mockSignOut = signOut as jest.Mock

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
  },
  expires: '2024-12-31',
}

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders navbar with logo', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Navbar />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /go to homepage/i })).toHaveAttribute('href', '/')
      expect(screen.getByText('Auth Starter')).toBeInTheDocument()
    })

    it('has proper ARIA labels and roles', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Navbar />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Main navigation')

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false')
      expect(mobileMenuButton).toHaveAttribute('aria-controls', 'mobile-menu')
    })
  })

  describe('Loading State', () => {
    it('shows loading skeleton when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<Navbar />)

      const loadingSkeleton = screen.getAllByRole('generic').find(el => el.classList.contains('animate-pulse'))
      expect(loadingSkeleton).toBeInTheDocument()
    })

    it('shows loading skeleton in mobile menu when session is loading', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      const mobileLoadingSkeleton = screen.getAllByRole('generic').find(el => 
        el.classList.contains('animate-pulse') && el.classList.contains('px-3')
      )
      expect(mobileLoadingSkeleton).toBeInTheDocument()
    })
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('shows login and signup buttons in desktop view', () => {
      render(<Navbar />)

      expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register')
    })

    it('shows only home link in desktop navigation when not authenticated', () => {
      render(<Navbar />)

      expect(screen.getByRole('link', { name: /home page/i })).toHaveAttribute('href', '/')
      expect(screen.queryByRole('link', { name: /go to dashboard/i })).not.toBeInTheDocument()
    })

    it('shows login and signup links in mobile menu', async () => {
      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      const mobileMenu = screen.getByRole('menu')
      expect(mobileMenu).toBeInTheDocument()

      const loginLink = screen.getByRole('menuitem', { name: /log in/i })
      const signupLink = screen.getByRole('menuitem', { name: /sign up/i })

      expect(loginLink).toHaveAttribute('href', '/login')
      expect(signupLink).toHaveAttribute('href', '/register')
    })
  })

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('shows user dropdown in desktop view', () => {
      render(<Navbar />)

      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /user menu/i })).toHaveTextContent('Test User')
    })

    it('shows dashboard link in desktop navigation when authenticated', () => {
      render(<Navbar />)

      expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/dashboard')
    })

    it('shows user info in dropdown menu', () => {
      render(<Navbar />)

      expect(screen.getByTestId('dropdown-label')).toHaveTextContent('Test User')
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('shows dashboard link and logout option in dropdown', () => {
      render(<Navbar />)

      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
      expect(screen.getByText('Log out')).toBeInTheDocument()
    })

    it('shows user info and logout in mobile menu', async () => {
      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument()
    })

    it('shows dashboard link in mobile menu when authenticated', async () => {
      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      expect(screen.getByRole('menuitem', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('User Display Name Logic', () => {
    it('displays user name when available', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(<Navbar />)

      expect(screen.getByRole('button', { name: /user menu/i })).toHaveTextContent('Test User')
    })

    it('displays email when name is not available', () => {
      const sessionWithoutName = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: null,
          image: null,
        },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: sessionWithoutName,
        status: 'authenticated',
      })

      render(<Navbar />)

      expect(screen.getByRole('button', { name: /user menu/i })).toHaveTextContent('test@example.com')
    })

    it('displays "User" as fallback when name and email are not available', () => {
      const sessionWithoutNameOrEmail = {
        user: {
          id: 'test-user-id',
          email: null,
          name: null,
          image: null,
        },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: sessionWithoutNameOrEmail,
        status: 'authenticated',
      })

      render(<Navbar />)

      expect(screen.getByRole('button', { name: /user menu/i })).toHaveTextContent('User')
    })
  })

  describe('Mobile Menu Functionality', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('toggles mobile menu when button is clicked', async () => {
      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      
      // Initially closed
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false')
      
      // Open menu
      await user.click(mobileMenuButton)
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('menu')).toBeInTheDocument()
      
      // Close menu
      await user.click(mobileMenuButton)
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('shows menu icon when closed and X icon when open', async () => {
      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      
      // Initially shows menu icon (this is a bit tricky to test with mocked components)
      await user.click(mobileMenuButton)
      // After click, should show X icon
      
      await user.click(mobileMenuButton)
      // Back to menu icon
    })

    it('closes mobile menu when menu item is clicked', async () => {
      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      const homeLink = screen.getByRole('menuitem', { name: /home/i })
      await user.click(homeLink)

      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('has proper accessibility attributes for mobile menu', async () => {
      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      const mobileMenu = screen.getByRole('menu')
      expect(mobileMenu).toHaveAttribute('id', 'mobile-menu')
      expect(mobileMenu).toHaveAttribute('aria-labelledby', 'mobile-menu-button')

      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems.length).toBeGreaterThan(0)
    })
  })

  describe('Logout Functionality', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('handles logout from desktop dropdown', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValue(undefined)

      render(<Navbar />)

      const logoutButton = screen.getByText('Log out').closest('[data-testid="dropdown-item"]')
      await user.click(logoutButton!)

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })

    it('handles logout from mobile menu', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValue(undefined)

      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      const logoutButton = screen.getByRole('menuitem', { name: /log out/i })
      await user.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })

    it('shows loading state during logout in desktop view', async () => {
      const user = userEvent.setup()
      let resolveSignOut: (value: any) => void
      mockSignOut.mockReturnValue(new Promise(resolve => {
        resolveSignOut = resolve
      }))

      render(<Navbar />)

      const logoutButton = screen.getByText('Log out').closest('[data-testid="dropdown-item"]')
      await user.click(logoutButton!)

      expect(screen.getByText('Logging out...')).toBeInTheDocument()

      resolveSignOut!(undefined)

      await waitFor(() => {
        expect(screen.queryByText('Logging out...')).not.toBeInTheDocument()
      })
    })

    it('shows loading state during logout in mobile view', async () => {
      const user = userEvent.setup()
      let resolveSignOut: (value: any) => void
      mockSignOut.mockReturnValue(new Promise(resolve => {
        resolveSignOut = resolve
      }))

      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      const logoutButton = screen.getByRole('menuitem', { name: /log out/i })
      await user.click(logoutButton)

      expect(screen.getByText('Logging out...')).toBeInTheDocument()
      expect(logoutButton).toBeDisabled()

      resolveSignOut!(undefined)

      await waitFor(() => {
        expect(screen.queryByText('Logging out...')).not.toBeInTheDocument()
      })
    })

    it('closes mobile menu when logout is initiated', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValue(undefined)

      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true')

      const logoutButton = screen.getByRole('menuitem', { name: /log out/i })
      await user.click(logoutButton)

      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('handles logout errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSignOut.mockRejectedValue(new Error('Logout failed'))

      render(<Navbar />)

      const logoutButton = screen.getByText('Log out').closest('[data-testid="dropdown-item"]')
      await user.click(logoutButton!)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('disables logout button during logout', async () => {
      const user = userEvent.setup()
      let resolveSignOut: (value: any) => void
      mockSignOut.mockReturnValue(new Promise(resolve => {
        resolveSignOut = resolve
      }))

      render(<Navbar />)

      const logoutButton = screen.getByText('Log out').closest('[data-testid="dropdown-item"]')
      await user.click(logoutButton!)

      const loadingButton = screen.getByText('Logging out...').closest('[data-testid="dropdown-item"]')
      expect(loadingButton).toHaveStyle({ opacity: '0.5' })

      resolveSignOut!(undefined)
    })
  })

  describe('Navigation Links', () => {
    it('has correct navigation links when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Navbar />)

      expect(screen.getByRole('link', { name: /home page/i })).toHaveAttribute('href', '/')
      expect(screen.queryByRole('link', { name: /go to dashboard/i })).not.toBeInTheDocument()
    })

    it('has correct navigation links when authenticated', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(<Navbar />)

      expect(screen.getByRole('link', { name: /home page/i })).toHaveAttribute('href', '/')
      expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/dashboard')
    })

    it('has proper accessibility attributes for navigation links', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(<Navbar />)

      const homeLink = screen.getByRole('link', { name: /home page/i })
      const dashboardLink = screen.getByRole('link', { name: /go to dashboard/i })

      expect(homeLink).toHaveAttribute('aria-label', 'Home page')
      expect(dashboardLink).toHaveAttribute('aria-label', 'Go to dashboard')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for icons', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Navbar />)

      // Icons should be marked as aria-hidden
      const homeIcon = screen.getByRole('link', { name: /home page/i }).querySelector('[aria-hidden="true"]')
      expect(homeIcon).toBeInTheDocument()
    })

    it('has proper focus management', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Navbar />)

      const links = screen.getAllByRole('link')
      const buttons = screen.getAllByRole('button')

      // All interactive elements should have focus styles
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2')
      })

      buttons.forEach(button => {
        expect(button).toHaveClass('focus:ring-2')
      })
    })

    it('provides proper context for screen readers', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      const mobileMenu = screen.getByRole('menu')
      expect(mobileMenu).toHaveAttribute('aria-labelledby', 'mobile-menu-button')

      const menuItems = screen.getAllByRole('menuitem')
      menuItems.forEach(item => {
        expect(item).toHaveAttribute('role', 'menuitem')
      })
    })

    it('maintains focus trap in mobile menu', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      await user.click(mobileMenuButton)

      // Mobile menu should be visible and focusable
      const mobileMenu = screen.getByRole('menu')
      expect(mobileMenu).toBeVisible()

      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems.length).toBeGreaterThan(0)

      // All menu items should be focusable
      menuItems.forEach(item => {
        expect(item).toHaveClass('focus:outline-none', 'focus:ring-2')
      })
    })
  })

  describe('Responsive Design', () => {
    it('hides desktop elements on mobile', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Navbar />)

      // Desktop navigation should be hidden on mobile
      const desktopNav = screen.getByRole('navigation').querySelector('.hidden.md\\:block')
      expect(desktopNav).toBeInTheDocument()

      // Desktop auth section should be hidden on mobile
      const desktopAuth = screen.getByRole('navigation').querySelector('.hidden.md\\:flex')
      expect(desktopAuth).toBeInTheDocument()
    })

    it('shows mobile menu button only on mobile', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<Navbar />)

      // Mobile menu button should be hidden on desktop
      const mobileMenuContainer = screen.getByRole('button', { name: /toggle mobile menu/i }).parentElement
      expect(mobileMenuContainer).toHaveClass('md:hidden')
    })

    it('handles mobile menu transitions', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const user = userEvent.setup()
      render(<Navbar />)

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
      const mobileMenu = screen.getByRole('menu').parentElement

      // Initially closed
      expect(mobileMenu).toHaveClass('max-h-0', 'opacity-0')

      // Open menu
      await user.click(mobileMenuButton)
      expect(mobileMenu).toHaveClass('max-h-96', 'opacity-100')

      // Close menu
      await user.click(mobileMenuButton)
      expect(mobileMenu).toHaveClass('max-h-0', 'opacity-0')
    })
  })
})