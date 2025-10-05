import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EditHackPage from './page';
import { createClient } from '@/lib/supabase/server';
import { getHackWithPrerequisites, getAllHacksForSelect } from '@/lib/hacks/supabase-utils';
import { redirect } from 'next/navigation';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/hacks/supabase-utils');
vi.mock('next/navigation');

// Mock HackForm to check what props it receives
vi.mock('@/components/hacks/HackForm', () => ({
  HackForm: ({ hack }: any) => {
    // This component will verify that the hack prop has the correct data
    return (
      <div data-testid="hack-form">
        <div data-testid="hack-content-body">{hack?.contentBody || hack?.content_body || 'NO CONTENT'}</div>
        <div data-testid="hack-content-type">{hack?.contentType || hack?.content_type || 'NO TYPE'}</div>
        <div data-testid="hack-image-url">{hack?.imageUrl || hack?.image_url || 'NO IMAGE'}</div>
      </div>
    );
  },
}));

describe('EditHackPage Integration', () => {
  const mockUser = {
    id: 'admin-123',
    email: 'admin@example.com',
  };

  const mockProfile = {
    is_admin: true,
  };

  it('passes correct data format from API to HackForm', async () => {
    // Mock the API response with camelCase (as it actually returns)
    const apiHackData = {
      id: 'hack-123',
      name: 'Test Hack',
      description: 'Test Description',
      contentBody: 'This is the actual content from API',
      contentType: 'content',
      imageUrl: 'https://example.com/image.jpg',
      prerequisiteIds: ['prereq-1'],
    };

    // Setup mocks
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockProfile }),
          })),
        })),
      })),
    } as any);

    vi.mocked(getHackWithPrerequisites).mockResolvedValue(apiHackData as any);
    vi.mocked(getAllHacksForSelect).mockResolvedValue([]);

    // Render the page
    const Component = await EditHackPage({ params: { id: 'hack-123' } });
    const { container } = render(Component);

    // Check that the form receives the data
    expect(screen.getByTestId('hack-form')).toBeInTheDocument();

    // Verify content is passed correctly (should show the content, not 'NO CONTENT')
    expect(screen.getByTestId('hack-content-body')).toHaveTextContent('This is the actual content from API');
    expect(screen.getByTestId('hack-content-type')).toHaveTextContent('content');
    expect(screen.getByTestId('hack-image-url')).toHaveTextContent('https://example.com/image.jpg');
  });

  it('handles both snake_case and camelCase data formats', async () => {
    // Test with snake_case data
    const snakeCaseData = {
      id: 'hack-123',
      name: 'Test Hack',
      description: 'Test Description',
      content_body: 'Snake case content',
      content_type: 'content',
      image_url: 'https://example.com/snake.jpg',
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockProfile }),
          })),
        })),
      })),
    } as any);

    vi.mocked(getHackWithPrerequisites).mockResolvedValue(snakeCaseData as any);
    vi.mocked(getAllHacksForSelect).mockResolvedValue([]);

    const Component = await EditHackPage({ params: { id: 'hack-123' } });
    render(Component);

    // Should still work with snake_case
    expect(screen.getByTestId('hack-content-body')).toHaveTextContent('Snake case content');
    expect(screen.getByTestId('hack-content-type')).toHaveTextContent('content');
    expect(screen.getByTestId('hack-image-url')).toHaveTextContent('https://example.com/snake.jpg');
  });

  it('shows error when content is missing for content type', async () => {
    // Mock data with missing content for content type
    const incompleteData = {
      id: 'hack-123',
      name: 'Test Hack',
      description: 'Test Description',
      contentType: 'content',
      // contentBody is missing!
      imageUrl: 'https://example.com/image.jpg',
    };

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockProfile }),
          })),
        })),
      })),
    } as any);

    vi.mocked(getHackWithPrerequisites).mockResolvedValue(incompleteData as any);
    vi.mocked(getAllHacksForSelect).mockResolvedValue([]);

    const Component = await EditHackPage({ params: { id: 'hack-123' } });
    render(Component);

    // Should show NO CONTENT when content is missing
    expect(screen.getByTestId('hack-content-body')).toHaveTextContent('NO CONTENT');
  });

  it('redirects non-admin users', async () => {
    const mockRedirect = vi.mocked(redirect);

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { is_admin: false } }),
          })),
        })),
      })),
    } as any);

    await EditHackPage({ params: { id: 'hack-123' } });

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('redirects when hack not found', async () => {
    const mockRedirect = vi.mocked(redirect);

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockProfile }),
          })),
        })),
      })),
    } as any);

    vi.mocked(getHackWithPrerequisites).mockResolvedValue(null);

    await EditHackPage({ params: { id: 'non-existent' } });

    expect(mockRedirect).toHaveBeenCalledWith('/admin/hacks');
  });
});