/**
 * Test fixtures for hacks
 */

export const mockHacks = {
  basicHack: {
    id: 'hack-1',
    name: 'Basic Concepts',
    slug: 'basic-concepts',
    description: 'Learn the fundamental concepts',
    image_url: 'https://example.com/basic.jpg',
    image_path: null,
    content_type: 'content' as const,
    content_body: '<p>This is the basic content</p>',
    external_link: null,
    media_type: null,
    media_url: null,
    media_thumbnail_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    difficulty: 'beginner',
    time_minutes: 30,
    position: 0,
  },

  advancedHack: {
    id: 'hack-2',
    name: 'Advanced Techniques',
    slug: 'advanced-techniques',
    description: 'Master advanced techniques',
    image_url: 'https://example.com/advanced.jpg',
    image_path: '/images/advanced.jpg',
    content_type: 'content' as const,
    content_body: '<p>Advanced content here</p>',
    external_link: null,
    media_type: 'video',
    media_url: 'https://youtube.com/watch?v=123',
    media_thumbnail_url: 'https://img.youtube.com/vi/123/0.jpg',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    difficulty: 'advanced',
    time_minutes: 60,
    position: 1,
    prerequisite_ids: ['hack-1'],
  },

  externalLinkHack: {
    id: 'hack-3',
    name: 'External Resource',
    slug: 'external-resource',
    description: 'Learn from external resources',
    image_url: 'https://example.com/external.jpg',
    image_path: null,
    content_type: 'link' as const,
    content_body: null,
    external_link: 'https://external-resource.com/learn',
    media_type: null,
    media_url: null,
    media_thumbnail_url: null,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    difficulty: 'intermediate',
    time_minutes: 45,
    position: 2,
  },

  hackWithMedia: {
    id: 'hack-4',
    name: 'Video Tutorial',
    slug: 'video-tutorial',
    description: 'Learn through video',
    image_url: 'https://example.com/video.jpg',
    image_path: null,
    content_type: 'content' as const,
    content_body: '<p>Watch this video to learn</p>',
    external_link: null,
    media_type: 'iframe',
    media_url: 'https://codepen.io/pen/123',
    media_thumbnail_url: null,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    difficulty: 'beginner',
    time_minutes: 20,
    position: 3,
  },
};

export const mockHackFormData = {
  newHack: {
    name: 'New Test Hack',
    description: 'This is a test hack description',
    imageUrl: 'https://example.com/test-image.jpg',
    contentType: 'content' as const,
    contentBody: '<p>Test content for the hack</p>',
    difficulty: 'beginner',
    timeMinutes: 30,
  },

  newHackWithLink: {
    name: 'External Link Hack',
    description: 'This hack links to external content',
    imageUrl: 'https://example.com/link-image.jpg',
    contentType: 'link' as const,
    externalLink: 'https://example.com/external-content',
    difficulty: 'intermediate',
    timeMinutes: 45,
  },

  newHackWithPrerequisites: {
    name: 'Advanced Hack with Prerequisites',
    description: 'This hack requires prior knowledge',
    imageUrl: 'https://example.com/advanced-image.jpg',
    contentType: 'content' as const,
    contentBody: '<p>Advanced content</p>',
    prerequisiteIds: ['hack-1', 'hack-2'],
    difficulty: 'advanced',
    timeMinutes: 90,
  },

  updateHackData: {
    name: 'Updated Hack Name',
    description: 'Updated description',
    imageUrl: 'https://example.com/updated-image.jpg',
    contentType: 'content' as const,
    contentBody: '<p>Updated content</p>',
    difficulty: 'intermediate',
    timeMinutes: 40,
  },
};

export const mockUserInteractions = {
  likedHack: {
    hack_id: 'hack-1',
    user_id: 'user-123',
    liked: true,
    viewed: true,
    view_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },

  viewedHack: {
    hack_id: 'hack-2',
    user_id: 'user-123',
    liked: false,
    viewed: true,
    view_count: 2,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },

  notInteracted: {
    hack_id: 'hack-3',
    user_id: 'user-123',
    liked: false,
    viewed: false,
    view_count: 0,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
};

export const mockTags = [
  { id: 'tag-1', name: 'JavaScript', slug: 'javascript' },
  { id: 'tag-2', name: 'React', slug: 'react' },
  { id: 'tag-3', name: 'TypeScript', slug: 'typescript' },
  { id: 'tag-4', name: 'Testing', slug: 'testing' },
  { id: 'tag-5', name: 'Performance', slug: 'performance' },
];

export const mockUsers = {
  adminUser: {
    id: 'admin-123',
    email: 'admin@test.com',
    name: 'Admin User',
    is_admin: true,
    created_at: '2024-01-01T00:00:00Z',
  },

  regularUser: {
    id: 'user-123',
    email: 'user@test.com',
    name: 'Regular User',
    is_admin: false,
    created_at: '2024-01-01T00:00:00Z',
  },

  newUser: {
    id: 'user-456',
    email: 'new@test.com',
    name: 'New User',
    is_admin: false,
    created_at: '2024-01-15T00:00:00Z',
  },
};

export const createMockHack = (overrides?: Partial<typeof mockHacks.basicHack>) => {
  return {
    ...mockHacks.basicHack,
    ...overrides,
    id: overrides?.id || `hack-${Date.now()}`,
    slug: overrides?.slug || `${overrides?.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
  };
};

export const createMockFormData = (overrides?: Partial<typeof mockHackFormData.newHack>) => {
  return {
    ...mockHackFormData.newHack,
    ...overrides,
  };
};