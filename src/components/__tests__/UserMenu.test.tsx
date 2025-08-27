import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession, signOut } from 'next-auth/react'
import { UserMenu, UserMenuMobile } from '../UserMenu'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
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

const mockSessionWithImage = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  },
  expires: '2024-12-31',
}

describe('UserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading skeleton when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<UserMenu />)

      expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
    })
  })

  describe('Unauthenticated State', () => {
    it('shows login and signup buttons when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<UserMenu />)

      expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register')
    })

    it('applies custom className when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      const customClass = 'custom-test-class'
      render(<UserMenu className={customClass} />)

      const container = screen.getByRole('link', { name: /log in/i }).closest('div')
      expect(container).toHaveClass(customClass)
    })
  })

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('shows user menu trigger with user name', () => {
      render(<UserMenu />)

      const trigger = screen.getByRole('button', { name: /user menu/i })
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveTextContent('Test User')
    })

    it('shows initials when no user image is provided', () => {
      render(<UserMenu />)

      const initialsElement = screen.getByText('TU')
      expect(initialsElement).toBeInTheDocument()
      expect(initialsElement).toHaveClass('bg-blue-600')
    })

    it('shows user image when provided', () => {
      mockUseSession.mockReturnValue({
        data: mockSessionWithImage,
        status: 'authenticated',
      })

      render(<UserMenu />)

      const avatar = screen.getByRole('img', { name: /test user's avatar/i })
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('shows dropdown menu items', () => {
      render(<UserMenu />)

      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Log out')).toBeInTheDocument()
    })

    it('shows user info in dropdown header', () => {
      render(<UserMenu />)

      expect(screen.getByTestId('dropdown-label')).toHaveTextContent('Test User')
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('has correct navigation links', () => {
      render(<UserMenu />)

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      const profileLink = screen.getByRole('link', { name: /profile/i })
      const settingsLink = screen.getByRole('link', { name: /settings/i })

      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
      expect(profileLink).toHaveAttribute('href', '/profile')
      expect(settingsLink).toHaveAttribute('href', '/settings')
    })
  })

  describe('User Display Name Logic', () => {
    it('uses user name when available', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })

      render(<UserMenu />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('uses email when name is not available', () => {
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

      render(<UserMenu />)

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('uses "User" as fallback when name and email are not available', () => {
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

      render(<UserMenu />)

      expect(screen.getByText('User')).toBeInTheDocument()
    })
  })

  describe('Initials Generation', () => {
    it('generates initials from full name', () => {
      render(<UserMenu />)

      expect(screen.getByText('TU')).toBeInTheDocument()
    })

    it('generates initials from single name', () => {
      const sessionWithSingleName = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'TestUser',
          image: null,
        },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: sessionWithSingleName,
        status: 'authenticated',
      })

      render(<UserMenu />)

      expect(screen.getByText('TE')).toBeInTheDocument()
    })

    it('handles long names by taking only first two initials', () => {
      const sessionWithLongName = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'John Doe Smith Johnson',
          image: null,
        },
        expires: '2024-12-31',
      }

      mockUseSession.mockReturnValue({
        data: sessionWithLongName,
        status: 'authenticated',
      })

      render(<UserMenu />)

      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  describe('Logout Functionality', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('handles logout when logout button is clicked', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValue(undefined)

      render(<UserMenu />)

      const logoutButton = screen.getByTestId('dropdown-item')
      await user.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })

    it('shows loading state during logout', async () => {
      const user = userEvent.setup()
      let resolveSignOut: (value: any) => void
      mockSignOut.mockReturnValue(new Promise(resolve => {
        resolveSignOut = resolve
      }))

      render(<UserMenu />)

      const logoutButton = screen.getByText('Log out').closest('[data-testid="dropdown-item"]')
      await user.click(logoutButton!)

      expect(screen.getByText('Logging out...')).toBeInTheDocument()

      // Resolve the promise
      resolveSignOut!(undefined)

      await waitFor(() => {
        expect(screen.queryByText('Logging out...')).not.toBeInTheDocument()
      })
    })

    it('handles logout errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSignOut.mockRejectedValue(new Error('Logout failed'))

      render(<UserMenu />)

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

      render(<UserMenu />)

      const logoutButton = screen.getByText('Log out').closest('[data-testid="dropdown-item"]')
      await user.click(logoutButton!)

      const disabledButton = screen.getByText('Logging out...').closest('[data-testid="dropdown-item"]')
      expect(disabledButton).toHaveStyle({ opacity: '0.5' })

      resolveSignOut!(undefined)
    })
  })

  describe('Dropdown Positioning', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('uses default align prop', () => {
      render(<UserMenu />)

      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
    })

    it('accepts custom align prop', () => {
      render(<UserMenu align="start" />)

      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
    })

    it('accepts custom sideOffset prop', () => {
      render(<UserMenu sideOffset={8} />)

      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('has proper ARIA label for menu trigger', () => {
      render(<UserMenu />)

      const trigger = screen.getByRole('button', { name: /user menu/i })
      expect(trigger).toHaveAttribute('aria-label', 'User menu')
    })

    it('has proper alt text for user avatar', () => {
      mockUseSession.mockReturnValue({
        data: mockSessionWithImage,
        status: 'authenticated',
      })

      render(<UserMenu />)

      const avatar = screen.getByRole('img', { name: /test user's avatar/i })
      expect(avatar).toHaveAttribute('alt', "Test User's avatar")
    })

    it('marks decorative elements with aria-hidden', () => {
      render(<UserMenu />)

      const chevronIcon = screen.getByTestId('dropdown-trigger').querySelector('[aria-hidden="true"]')
      expect(chevronIcon).toBeInTheDocument()
    })
  })
})

describe('UserMenuMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading skeleton when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<UserMenuMobile />)

      expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
    })
  })

  describe('Unauthenticated State', () => {
    it('shows login and signup links when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<UserMenuMobile />)

      expect(screen.getByRole('menuitem', { name: /log in/i })).toHaveAttribute('href', '/login')
      expect(screen.getByRole('menuitem', { name: /sign up/i })).toHaveAttribute('href', '/register')
    })

    it('calls onMenuItemClick when menu items are clicked', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<UserMenuMobile onMenuItemClick={mockOnClick} />)

      const loginLink = screen.getByRole('menuitem', { name: /log in/i })
      await user.click(loginLink)

      expect(mockOnClick).toHaveBeenCalled()
    })
  })

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('shows user info section', () => {
      render(<UserMenuMobile />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('shows navigation menu items with proper roles', () => {
      render(<UserMenuMobile />)

      expect(screen.getByRole('menuitem', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
      expect(screen.getByRole('menuitem', { name: /profile/i })).toHaveAttribute('href', '/profile')
      expect(screen.getByRole('menuitem', { name: /settings/i })).toHaveAttribute('href', '/settings')
      expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument()
    })

    it('shows user avatar when image is provided', () => {
      mockUseSession.mockReturnValue({
        data: mockSessionWithImage,
        status: 'authenticated',
      })

      render(<UserMenuMobile />)

      const avatar = screen.getByRole('img', { name: /test user's avatar/i })
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('shows initial when no image is provided', () => {
      render(<UserMenuMobile />)

      const initial = screen.getByText('T')
      expect(initial).toBeInTheDocument()
      expect(initial).toHaveClass('bg-blue-600')
    })

    it('calls onMenuItemClick when navigation items are clicked', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()

      render(<UserMenuMobile onMenuItemClick={mockOnClick} />)

      const dashboardLink = screen.getByRole('menuitem', { name: /dashboard/i })
      await user.click(dashboardLink)

      expect(mockOnClick).toHaveBeenCalled()
    })
  })

  describe('Mobile Logout Functionality', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('handles logout when logout button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()
      mockSignOut.mockResolvedValue(undefined)

      render(<UserMenuMobile onMenuItemClick={mockOnClick} />)

      const logoutButton = screen.getByRole('menuitem', { name: /log out/i })
      await user.click(logoutButton)

      expect(mockOnClick).toHaveBeenCalled()
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })

    it('shows loading state during logout', async () => {
      const user = userEvent.setup()
      let resolveSignOut: (value: any) => void
      mockSignOut.mockReturnValue(new Promise(resolve => {
        resolveSignOut = resolve
      }))

      render(<UserMenuMobile />)

      const logoutButton = screen.getByRole('menuitem', { name: /log out/i })
      await user.click(logoutButton)

      expect(screen.getByText('Logging out...')).toBeInTheDocument()
      expect(logoutButton).toBeDisabled()

      resolveSignOut!(undefined)

      await waitFor(() => {
        expect(screen.queryByText('Logging out...')).not.toBeInTheDocument()
      })
    })

    it('handles logout errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSignOut.mockRejectedValue(new Error('Logout failed'))

      render(<UserMenuMobile />)

      const logoutButton = screen.getByRole('menuitem', { name: /log out/i })
      await user.click(logoutButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Mobile Accessibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('has proper menuitem roles for all interactive elements', () => {
      render(<UserMenuMobile />)

      const menuItems = screen.getAllByRole('menuitem')
      expect(menuItems).toHaveLength(4) // Dashboard, Profile, Settings, Log out
    })

    it('has proper alt text for user avatar in mobile view', () => {
      mockUseSession.mockReturnValue({
        data: mockSessionWithImage,
        status: 'authenticated',
      })

      render(<UserMenuMobile />)

      const avatar = screen.getByRole('img', { name: /test user's avatar/i })
      expect(avatar).toHaveAttribute('alt', "Test User's avatar")
    })

    it('marks decorative icons with aria-hidden', () => {
      render(<UserMenuMobile />)

      const icons = screen.getByRole('menuitem', { name: /dashboard/i }).querySelectorAll('[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })
})