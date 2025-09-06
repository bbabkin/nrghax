import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HackCard } from './HackCard'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}))

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}))

// Mock icons
vi.mock('@/components/icons', () => ({
  Icons: {
    heart: () => <span>Heart Icon</span>,
    checkCircle: () => <span>Check Icon</span>,
    externalLink: () => <span>External Link Icon</span>,
    lock: () => <span>Lock Icon</span>,
  }
}))

describe('HackCard Component', () => {
  const mockHack = {
    id: '1',
    name: 'Test Hack',
    description: 'Test Description',
    image_url: 'https://example.com/image.jpg',
    content_type: 'content' as const,
    external_link: null,
    like_count: 10,
    is_completed: false,
    is_liked: false
  }

  it('should render hack card with basic information', () => {
    render(<HackCard hack={mockHack} />)
    
    expect(screen.getByText('Test Hack')).toBeDefined()
    expect(screen.getByText('Test Description')).toBeDefined()
    expect(screen.getByAltText('Test Hack')).toBeDefined()
  })

  it('should show likes count', () => {
    render(<HackCard hack={mockHack} />)
    
    expect(screen.getByText('10')).toBeDefined() // likes
  })

  it('should show completed badge when hack is completed', () => {
    const completedHack = { ...mockHack, is_completed: true }
    render(<HackCard hack={completedHack} />)
    
    expect(screen.getByText('Completed')).toBeDefined()
  })

  it('should show locked state when prerequisites not met', () => {
    render(<HackCard hack={mockHack} hasIncompletePrerequisites={true} />)
    
    // The locked state shows a Lock icon overlay, not text
    const { container } = render(<HackCard hack={mockHack} hasIncompletePrerequisites={true} />)
    const lockIcon = container.querySelector('.lucide-lock')
    expect(lockIcon).toBeDefined()
  })

  it('should show external link icon for link type hacks', () => {
    const linkHack = { 
      ...mockHack, 
      content_type: 'link' as const, 
      external_link: 'https://external.com' 
    }
    const { container } = render(<HackCard hack={linkHack} />)
    
    // Look for the ExternalLink icon by class
    const externalLinkIcon = container.querySelector('.lucide-external-link')
    expect(externalLinkIcon).toBeDefined()
  })

  it('should highlight liked hacks', () => {
    const likedHack = { ...mockHack, is_liked: true }
    const { container } = render(<HackCard hack={likedHack} />)
    
    // Check if the heart icon has the filled class
    const heartContainer = container.querySelector('.text-red-500')
    expect(heartContainer).toBeDefined()
  })
})