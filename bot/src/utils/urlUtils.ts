/**
 * Utility functions for handling URLs in bot responses
 */

/**
 * Replace localhost URLs with production URLs
 */
export function fixUrl(url: string | undefined): string | undefined {
  if (!url) return url;

  const webAppUrl = process.env.WEB_APP_URL || 'https://nrghax.com';

  return url
    .replace(/http:\/\/localhost:\d+/g, webAppUrl)
    .replace(/https:\/\/localhost:\d+/g, webAppUrl)
    .replace(/localhost:\d+/g, webAppUrl.replace(/https?:\/\//, ''));
}

/**
 * Fix localhost URLs in text content
 */
export function fixTextUrls(text: string | undefined): string | undefined {
  if (!text) return text;

  const webAppUrl = process.env.WEB_APP_URL || 'https://nrghax.com';

  return text
    .replace(/http:\/\/localhost:\d+/g, webAppUrl)
    .replace(/https:\/\/localhost:\d+/g, webAppUrl)
    .replace(/localhost:\d+/g, webAppUrl.replace(/https?:\/\//, ''));
}

/**
 * Generate web app URL for a specific hack
 */
export function getHackUrl(hackId: string): string {
  const webAppUrl = process.env.WEB_APP_URL || 'https://nrghax.com';
  return `${webAppUrl}/hacks/${hackId}`;
}

/**
 * Generate web app URL for a category
 */
export function getCategoryUrl(category: string): string {
  const webAppUrl = process.env.WEB_APP_URL || 'https://nrghax.com';
  return `${webAppUrl}/hacks?category=${encodeURIComponent(category)}`;
}

/**
 * Generate web app URL for search
 */
export function getSearchUrl(query: string): string {
  const webAppUrl = process.env.WEB_APP_URL || 'https://nrghax.com';
  return `${webAppUrl}/hacks?search=${encodeURIComponent(query)}`;
}