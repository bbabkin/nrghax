'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { LibrarySkillsNav } from './LibrarySkillsNav';

/**
 * Controls the display of the LibrarySkillsNav based on the current route.
 * Shows the nav on /hacks and /levels pages
 * Also hides the main navbar on these pages
 */
export function NavigationController() {
  const pathname = usePathname();

  // Determine if we should show the LibrarySkillsNav
  const shouldShowLibrarySkillsNav = pathname === '/hacks' || pathname === '/levels';

  useEffect(() => {
    // Hide the main navbar and footer on these pages
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');

    if (shouldShowLibrarySkillsNav) {
      if (navbar) navbar.style.display = 'none';
      if (footer) footer.style.display = 'none';
    }

    return () => {
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, [pathname, shouldShowLibrarySkillsNav]);

  if (!shouldShowLibrarySkillsNav) {
    return null;
  }

  return <LibrarySkillsNav />;
}