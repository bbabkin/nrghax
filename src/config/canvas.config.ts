/**
 * Canvas configuration constants
 * Centralized configuration for the unified canvas system
 */

// Layout dimensions
export const CANVAS_CONFIG = {
  // Heights
  VIEWPORT_HEIGHT: '200vh',
  NAV_HEIGHT: 80,
  SECTION_HEIGHT: '100vh',
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,

  // Spacing
  CONTENT_PADDING: 20,
  CARD_GAP: 24,
  SECTION_MARGIN: 48,

  // Breakpoints
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280,
} as const;

// Scroll navigation settings
export const SCROLL_CONFIG = {
  // Edge detection
  EDGE_TOLERANCE: 20,
  EDGE_DWELL_TIME: 200,

  // Thresholds by device type
  THRESHOLD_BASE: 400,
  THRESHOLD_MULTIPLIERS: {
    MOUSE: 1.5,      // 600px
    TRACKPAD: 1.0,   // 400px
    TOUCH: 0.75,     // 300px
  },

  // Progress indicator
  PROGRESS_SHOW_THRESHOLD: 10, // Show after 10% progress
  PROGRESS_HIDE_DELAY: 1000,

  // Restoration
  RESTORE_DELAY: 100,
  RESTORE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
} as const;

// Animation settings
export const ANIMATION_CONFIG = {
  // Spring animation
  SPRING: {
    damping: 30,
    stiffness: 200,
    mass: 0.8,
  },

  // Durations
  TRANSITION_DURATION: 500,
  FADE_DURATION: 200,
  SLIDE_DURATION: 300,

  // Easing
  EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Visual styling
export const VISUAL_CONFIG = {
  // Colors
  COLORS: {
    PRIMARY: '#FFBB00',
    PRIMARY_HOVER: '#FFA500',
    BACKGROUND: '#09090b',
    CARD_BG: '#18181b',
    CARD_BORDER: '#27272a',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#a1a1aa',
    SUCCESS: '#22c55e',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
  },

  // Shadows
  SHADOWS: {
    CARD: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    CARD_HOVER: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    GLOW_GREEN: '0 0 20px rgba(34, 197, 94, 0.5)',
    GLOW_BLUE: '0 0 20px rgba(59, 130, 246, 0.5)',
    GLOW_PURPLE: '0 0 20px rgba(168, 85, 247, 0.5)',
    GLOW_ORANGE: '0 0 20px rgba(251, 146, 60, 0.5)',
  },

  // Clip paths
  CLIP_PATHS: {
    ANGLED_CARD: 'polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
    HEXAGON: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  },

  // Gradients
  GRADIENTS: {
    ENERGY_LOW: 'from-blue-500 to-cyan-500',
    ENERGY_MEDIUM: 'from-green-500 to-emerald-500',
    ENERGY_HIGH: 'from-yellow-500 to-orange-500',
    ENERGY_MAX: 'from-red-500 to-pink-500',
    LEVEL_CONNECTOR: 'from-zinc-800 via-yellow-500/20 to-zinc-800',
  },
} as const;

// Performance settings
export const PERFORMANCE_CONFIG = {
  // Virtualization
  VIRTUAL_SCROLL: {
    ITEM_HEIGHT: 280,
    OVERSCAN: 3,
    INITIAL_ITEMS: 12,
  },

  // Debounce/throttle
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,

  // Lazy loading
  LAZY_LOAD: {
    ROOT_MARGIN: '100px',
    THRESHOLD: 0.1,
  },

  // Caching
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;

// Accessibility settings
export const A11Y_CONFIG = {
  // Focus management
  FOCUS_VISIBLE_OUTLINE: '2px solid #FFBB00',
  FOCUS_VISIBLE_OFFSET: 2,

  // Skip links
  SKIP_LINK_TARGETS: ['#main-content', '#skills-content', '#library-content', '#navigation'],

  // ARIA labels
  ARIA_LABELS: {
    CANVAS: 'Skills and Library Canvas',
    SKILLS_TREE: 'Skills progression tree',
    LIBRARY_GRID: 'Hack and routine library',
    NAVIGATION: 'View navigation tabs',
    SEARCH: 'Search hacks and routines',
    USER_MENU: 'User account menu',
  },

  // Live regions
  LIVE_REGION_DELAY: 100,
} as const;

// Grid layouts
export const GRID_CONFIG = {
  // Library grid
  LIBRARY: {
    COLUMNS: {
      MOBILE: 1,
      TABLET: 2,
      DESKTOP: 3,
      WIDE: 4,
    },
    GAP: 24,
  },

  // Skills tree
  SKILLS: {
    MAX_WIDTH: 896, // max-w-4xl
    CARD_WIDTH: 448, // max-w-md
    VERTICAL_SPACING: 96,
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  // Session storage
  SCROLL_POSITION: 'canvas-scroll-position',
  VIEW_STATE: 'canvas-view-state',
  RETURN_PATH: 'canvas-return-path',

  // Local storage
  ONBOARDING_DISMISSED: 'canvas-onboarding-dismissed',
  PREFERRED_VIEW: 'canvas-preferred-view',
  DEVICE_TYPE: 'canvas-device-type',
  THEME_PREFERENCE: 'canvas-theme',
} as const;

// Device detection
export const DEVICE_CONFIG = {
  // Scroll delta thresholds for detection
  TRACKPAD_DELTA_THRESHOLD: 40,
  MOMENTUM_THRESHOLD: 100,

  // Touch settings
  TOUCH_SWIPE_THRESHOLD: 50,
  TOUCH_SWIPE_VELOCITY: 0.5,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  LOAD_FAILED: 'Failed to load content. Please try refreshing the page.',
  NAVIGATION_FAILED: 'Navigation failed. Please try again.',
  SAVE_FAILED: 'Failed to save progress. Please check your connection.',
  AUTH_REQUIRED: 'Please sign in to access this feature.',
} as const;

// Helper functions
export const getScrollThreshold = (deviceType: 'mouse' | 'trackpad' | 'touch' = 'trackpad') => {
  return SCROLL_CONFIG.THRESHOLD_BASE * SCROLL_CONFIG.THRESHOLD_MULTIPLIERS[deviceType.toUpperCase() as keyof typeof SCROLL_CONFIG.THRESHOLD_MULTIPLIERS];
};

export const getGridColumns = (width: number) => {
  if (width < CANVAS_CONFIG.MOBILE_BREAKPOINT) return GRID_CONFIG.LIBRARY.COLUMNS.MOBILE;
  if (width < CANVAS_CONFIG.TABLET_BREAKPOINT) return GRID_CONFIG.LIBRARY.COLUMNS.TABLET;
  if (width < CANVAS_CONFIG.DESKTOP_BREAKPOINT) return GRID_CONFIG.LIBRARY.COLUMNS.DESKTOP;
  return GRID_CONFIG.LIBRARY.COLUMNS.WIDE;
};

export const getEnergyGradient = (level: number) => {
  if (level <= 2) return VISUAL_CONFIG.GRADIENTS.ENERGY_LOW;
  if (level <= 3) return VISUAL_CONFIG.GRADIENTS.ENERGY_MEDIUM;
  if (level <= 4) return VISUAL_CONFIG.GRADIENTS.ENERGY_HIGH;
  return VISUAL_CONFIG.GRADIENTS.ENERGY_MAX;
};

export const getProgressColor = (count: number) => {
  if (count === 1) return VISUAL_CONFIG.SHADOWS.GLOW_GREEN;
  if (count === 2) return VISUAL_CONFIG.SHADOWS.GLOW_BLUE;
  if (count === 3) return VISUAL_CONFIG.SHADOWS.GLOW_PURPLE;
  return VISUAL_CONFIG.SHADOWS.GLOW_ORANGE;
};