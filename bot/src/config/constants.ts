/**
 * Bot configuration constants
 */

export const CONSTANTS = {
  // Brand
  BRAND_COLOR: parseInt(process.env.BRAND_COLOR?.replace('#', '') || '10B981', 16),
  FOOTER_TEXT: process.env.FOOTER_TEXT || 'NRGhax × Discord',
  
  // Sync intervals
  ROLE_SYNC_INTERVAL_MS: (parseInt(process.env.ROLE_SYNC_INTERVAL_MINUTES || '30') * 60 * 1000),
  CACHE_TTL_MS: (parseInt(process.env.CACHE_TTL_SECONDS || '300') * 1000),
  
  // Pagination
  HACKS_PER_PAGE: 5,
  
  // Rate limiting
  COMMAND_COOLDOWN_MS: 3000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  
  // Bot personality messages
  MESSAGES: {
    GREETING: "Hey there! Ready to level up your energy? 🚀",
    HACK_INTRO: "Here's that energy hack you wanted to level up with! 🚀",
    ERROR_GENERIC: "Whoops! Hit a snag there. Let me try that again... 🔧",
    ERROR_NOT_FOUND: "Couldn't find what you're looking for. Let's explore other hacks! 🔍",
    SYNC_SUCCESS: "Your roles are all synced up! You're good to go! ✨",
    PING_RESPONSE: "I'm here and ready to help you optimize your energy! ⚡",
  }
} as const;