'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { LibrarySkillsNavSVG } from './LibrarySkillsNavSVG';

/**
 * Controls the display of the LibrarySkillsNav based on the current route.
 * Shows the nav on /skills and /library pages (NOT on landing page)
 * Also hides the main navbar on these pages
 */
export function NavigationController() {
  const pathname = usePathname();

  // Determine if we should show the LibrarySkillsNav
  // Show ONLY on library and skills pages (not on landing page or hacks pages)
  const shouldShowLibrarySkillsNav = pathname === '/library' || pathname === '/skills';

  useEffect(() => {
    // Hide the main navbar and footer on library/skills pages
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');

    if (shouldShowLibrarySkillsNav) {
      if (navbar) navbar.style.display = 'none';
      if (footer) footer.style.display = 'none';
    } else {
      // Restore navbar and footer on other pages
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
    }

    return () => {
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, [pathname, shouldShowLibrarySkillsNav]);

  if (!shouldShowLibrarySkillsNav) {
    return null;
  }

  // Tabs are part of natural document flow (NOT fixed)
  return <LibrarySkillsNavSVG />;
}