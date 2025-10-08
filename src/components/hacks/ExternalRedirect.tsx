'use client';

import { useEffect } from 'react';
import { useLocalVisits } from '@/hooks/useLocalVisits';

interface ExternalRedirectProps {
  hackId: string;
  externalUrl: string;
}

export function ExternalRedirect({ hackId, externalUrl }: ExternalRedirectProps) {
  const { markAsVisited } = useLocalVisits();

  useEffect(() => {
    // Mark as visited in localStorage for anonymous users
    markAsVisited(hackId);

    // Small delay to ensure localStorage is updated
    setTimeout(() => {
      // Open in new tab
      window.open(externalUrl, '_blank', 'noopener,noreferrer');

      // Redirect current tab back to hacks page
      window.location.href = '/hacks';
    }, 100);
  }, [hackId, externalUrl, markAsVisited]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Opening External Resource...</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Opening in a new tab</p>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">{externalUrl}</p>
        <p className="text-xs text-gray-400 dark:text-gray-300">Redirecting back to hacks page...</p>
        <a href="/hacks" className="text-blue-500 hover:underline mt-4 inline-block">
          ← Back to Hacks
        </a>
      </div>
    </div>
  );
}