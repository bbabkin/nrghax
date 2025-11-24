'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, Settings, Shield, Database, Tag, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';

interface LibrarySkillsNavCanvasSVGProps {
  className?: string;
  currentView: 'library' | 'skills';
  onViewChange: (view: 'library' | 'skills') => void;
  disabled?: boolean;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
  scrollProgress?: number; // 0-100
  scrollDirection?: 'up' | 'down' | null;
}

export function LibrarySkillsNavCanvasSVG({
  className,
  currentView,
  onViewChange,
  disabled = false,
  isAuthenticated = false,
  isAdmin = false,
  user,
  scrollProgress = 0,
  scrollDirection = null
}: LibrarySkillsNavCanvasSVGProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const isLibraryActive = currentView === 'library';

  const handleSignOut = async () => {
    try {
      console.log('[LibrarySkillsNav] Signing out...');
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('[LibrarySkillsNav] Sign out error:', error);
    }
  };

  // Calculate fill position based on current view and scroll progress
  // fillProgress: 0 = Library filled, 100 = Skills filled
  const getFillProgress = () => {
    if (scrollDirection && scrollProgress > 0) {
      if (currentView === 'library' && scrollDirection === 'up') {
        // Scrolling from library to skills (0 → 100)
        return scrollProgress;
      } else if (currentView === 'skills' && scrollDirection === 'down') {
        // Scrolling from skills to library (100 → 0)
        return 100 - scrollProgress;
      }
    }
    // No active scroll or at rest: snap to current view
    return currentView === 'library' ? 0 : 100;
  };

  const fillProgress = getFillProgress();

  // Calculate text opacity (0-1) for each tab
  // Library text: black when filled, white when not filled
  // Skills text: white when not filled, black when filled
  const getLibraryTextOpacity = () => {
    const threshold = 30; // Start transition at 30%
    if (fillProgress < threshold) return { black: 1, white: 0 };
    if (fillProgress > 70) return { black: 0, white: 1 };
    const t = (fillProgress - threshold) / 40;
    return { black: Math.max(0, 1 - t), white: Math.min(1, t) };
  };

  const getSkillsTextOpacity = () => {
    const threshold = 30; // Start transition at 30%
    if (fillProgress < threshold) return { black: 0, white: 1 };
    if (fillProgress > 70) return { black: 1, white: 0 };
    const t = (fillProgress - threshold) / 40;
    return { black: Math.min(1, t), white: Math.max(0, 1 - t) };
  };

  const libraryTextOpacity = getLibraryTextOpacity();
  const skillsTextOpacity = getSkillsTextOpacity();

  // Handle responsive SVG switching
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = (view: 'library' | 'skills') => {
    if (!disabled) {
      onViewChange(view);
    }
  };

  // Desktop SVG
  const DesktopSVG = () => {
    // Calculate opacity for each tab's yellow fill
    // Use overlapping fade for smooth transition
    const libraryFillOpacity = fillProgress <= 50
      ? 1
      : Math.max(0, 1 - ((fillProgress - 50) / 30)); // Fade out from 50-80%

    const skillsFillOpacity = fillProgress >= 20
      ? Math.min(1, (fillProgress - 20) / 30) // Fade in from 20-50%
      : 0;

    return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1266 78"
      className="w-full h-full"
      style={{ enableBackground: 'new 0 0 1266 78' } as any}
    >
      <defs>
        <style>{`
          .tab-outline {
            fill: none;
            stroke: #FFBB00;
            stroke-width: 3;
            stroke-miterlimit: 10;
          }
          .connector-line { fill: #FFFFFF; }
          .text-transition { transition: opacity 0.3s ease; }
        `}</style>
      </defs>

      {/* White connector lines */}
      <polygon
        className="connector-line"
        points="683,73.8 584,9.8 341.5,9.8 344.5,6.8 584.9,6.8 585.3,7 683.9,70.7 926.4,70.8 923.5,73.8"
      />

      {/* Tab outlines */}
      <polygon className="tab-outline" points="584.5,17.3 656.5,62.3 35.5,62.3 35.5,17.3" />
      <polygon className="tab-outline" points="611.5,17.3 683.5,62.3 1232.5,62.3 1232.5,17.3" />

      {/* Library tab yellow fill - fades out as we scroll to Skills */}
      <polygon
        fill="#FFBB00"
        points="584.5,17.3 656.5,62.3 35.5,62.3 35.5,17.3"
        style={{
          opacity: libraryFillOpacity,
          transition: scrollDirection ? 'none' : 'opacity 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)'
        }}
      />

      {/* Skills tab yellow fill - fades in as we scroll to Skills */}
      <polygon
        fill="#FFBB00"
        points="611.5,17.3 683.5,62.3 1232.5,62.3 1232.5,17.3"
        style={{
          opacity: skillsFillOpacity,
          transition: scrollDirection ? 'none' : 'opacity 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)'
        }}
      />

      {/* Clickable areas */}
      <polygon
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', fill: 'transparent' }}
        onClick={() => handleNavigate('library')}
        points="584.5,17.3 656.5,62.3 35.5,62.3 35.5,17.3"
      />
      <polygon
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', fill: 'transparent' }}
        onClick={() => handleNavigate('skills')}
        points="611.5,17.3 683.5,62.3 1232.5,62.3 1232.5,17.3"
      />

      {/* Library text - Black version */}
      <g onClick={() => handleNavigate('library')} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: libraryTextOpacity.black, transition: 'opacity 0.2s ease' }}>
        <path fill="#000000" d="M441.4,51.9V27.3h5.1v20h10.6v4.6H441.4z"/>
        <path fill="#000000" d="M460.5,29.9v-4.8h5.1v4.8H460.5z M460.6,51.9V33h4.9v18.8H460.6z"/>
        <path fill="#000000" d="M470.7,51.9V25.5h4.9V33h5.5c3.9,0,5.8,1.9,5.8,5.8v7.3c0,3.9-1.9,5.8-5.8,5.8H470.7z M475.6,47.6h5.2c0.8,0,1.1-0.4,1.1-1.1v-8c0-0.8-0.4-1.1-1.1-1.1h-5.2V47.6z"/>
        <path fill="#000000" d="M491.6,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7H498c-0.7,0-1.2,0.2-1.5,0.5v14H491.6z"/>
        <path fill="#000000" d="M510.6,51.9c-3.9,0-5.8-1.9-5.8-5.7s1.9-5.7,5.8-5.7h4.9v-2.1c0-0.8-0.4-1.1-1.1-1.1h-7.6v-2.7l2.1-1.6h5.7c3.9,0,5.8,1.9,5.8,5.8v13.1H510.6z M509.7,46.4c0,0.8,0.4,1.1,1.1,1.1h4.6v-3.3h-4.6c-0.8,0-1.1,0.4-1.1,1.1V46.4z"/>
        <path fill="#000000" d="M525.2,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7h-4.7c-0.7,0-1.2,0.2-1.5,0.5v14H525.2z"/>
        <path fill="#000000" d="M537.9,33.8l0.5-0.7h4.2l4.4,14.5h0.4l4.4-14.5h4.2l0.5,0.7L548.5,59h-4.2l-0.5-0.7l2.1-6.4h-2.4L537.9,33.8z"/>
      </g>

      {/* Library text - White version */}
      <g onClick={() => handleNavigate('library')} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: libraryTextOpacity.white, transition: 'opacity 0.2s ease' }}>
        <path fill="#FFFFFF" d="M441.4,51.9V27.3h5.1v20h10.6v4.6H441.4z"/>
        <path fill="#FFFFFF" d="M460.5,29.9v-4.8h5.1v4.8H460.5z M460.6,51.9V33h4.9v18.8H460.6z"/>
        <path fill="#FFFFFF" d="M470.7,51.9V25.5h4.9V33h5.5c3.9,0,5.8,1.9,5.8,5.8v7.3c0,3.9-1.9,5.8-5.8,5.8H470.7z M475.6,47.6h5.2c0.8,0,1.1-0.4,1.1-1.1v-8c0-0.8-0.4-1.1-1.1-1.1h-5.2V47.6z"/>
        <path fill="#FFFFFF" d="M491.6,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7H498c-0.7,0-1.2,0.2-1.5,0.5v14H491.6z"/>
        <path fill="#FFFFFF" d="M510.6,51.9c-3.9,0-5.8-1.9-5.8-5.7s1.9-5.7,5.8-5.7h4.9v-2.1c0-0.8-0.4-1.1-1.1-1.1h-7.6v-2.7l2.1-1.6h5.7c3.9,0,5.8,1.9,5.8,5.8v13.1H510.6z M509.7,46.4c0,0.8,0.4,1.1,1.1,1.1h4.6v-3.3h-4.6c-0.8,0-1.1,0.4-1.1,1.1V46.4z"/>
        <path fill="#FFFFFF" d="M525.2,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7h-4.7c-0.7,0-1.2,0.2-1.5,0.5v14H525.2z"/>
        <path fill="#FFFFFF" d="M537.9,33.8l0.5-0.7h4.2l4.4,14.5h0.4l4.4-14.5h4.2l0.5,0.7L548.5,59h-4.2l-0.5-0.7l2.1-6.4h-2.4L537.9,33.8z"/>
      </g>

      {/* Skills text - White version */}
      <g onClick={() => handleNavigate('skills')} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: skillsTextOpacity.white, transition: 'opacity 0.2s ease' }}>
        <path fill="#FFFFFF" d="M717.4,50v-2.8h11.1c0.7,0,1.1-0.4,1.1-1.1v-2.6c0-0.7-0.3-1.1-0.9-1.2l-7-1.4c-2.9-0.6-4.3-2.5-4.3-5.7v-2c0-4,2-6,6-6h8.2l2.4,1.9v2.8h-10.3c-0.7,0-1.1,0.4-1.1,1.1v2.3c0,0.7,0.3,1.1,0.9,1.2l7,1.4c2.9,0.6,4.3,2.5,4.3,5.7v2.3c0,4-2,6-6,6h-8.9L717.4,50z"/>
        <path fill="#FFFFFF" d="M739.1,51.9V25.5h4.9v14.7l6.5-7.1h4.8l0.4,0.8l-6.5,7l7,10.2l-0.4,0.8H751l-5.1-7.5l-2,2.2v5.3H739.1z"/>
        <path fill="#FFFFFF" d="M759.6,29.9v-4.8h5.1v4.8H759.6z M759.7,51.9V33h4.9v18.8H759.7z"/>
        <path fill="#FFFFFF" d="M769.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C772.1,52.2,769.7,49.8,769.7,45z"/>
        <path fill="#FFFFFF" d="M780.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C783.1,52.2,780.7,49.8,780.7,45z"/>
        <path fill="#FFFFFF" d="M791.3,50.3v-2.7h8.2c0.8,0,1.2-0.5,1.2-1.4c0-0.9-0.3-1.4-1-1.6l-3.9-0.6c-3-0.5-4.6-2.3-4.6-5.3c0-3.8,1.9-5.7,5.8-5.7h5.5l2.1,1.6v2.7h-7.4c-0.8,0-1.2,0.5-1.2,1.4c0,1,0.4,1.5,1.1,1.6l3.8,0.6c3,0.5,4.5,2.2,4.5,5.2c0,3.8-1.9,5.7-5.8,5.7h-6.3L791.3,50.3z"/>
      </g>

      {/* Skills text - Black version */}
      <g onClick={() => handleNavigate('skills')} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: skillsTextOpacity.black, transition: 'opacity 0.2s ease' }}>
        <path fill="#000000" d="M717.4,50v-2.8h11.1c0.7,0,1.1-0.4,1.1-1.1v-2.6c0-0.7-0.3-1.1-0.9-1.2l-7-1.4c-2.9-0.6-4.3-2.5-4.3-5.7v-2c0-4,2-6,6-6h8.2l2.4,1.9v2.8h-10.3c-0.7,0-1.1,0.4-1.1,1.1v2.3c0,0.7,0.3,1.1,0.9,1.2l7,1.4c2.9,0.6,4.3,2.5,4.3,5.7v2.3c0,4-2,6-6,6h-8.9L717.4,50z"/>
        <path fill="#000000" d="M739.1,51.9V25.5h4.9v14.7l6.5-7.1h4.8l0.4,0.8l-6.5,7l7,10.2l-0.4,0.8H751l-5.1-7.5l-2,2.2v5.3H739.1z"/>
        <path fill="#000000" d="M759.6,29.9v-4.8h5.1v4.8H759.6z M759.7,51.9V33h4.9v18.8H759.7z"/>
        <path fill="#000000" d="M769.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C772.1,52.2,769.7,49.8,769.7,45z"/>
        <path fill="#000000" d="M780.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C783.1,52.2,780.7,49.8,780.7,45z"/>
        <path fill="#000000" d="M791.3,50.3v-2.7h8.2c0.8,0,1.2-0.5,1.2-1.4c0-0.9-0.3-1.4-1-1.6l-3.9-0.6c-3-0.5-4.6-2.3-4.6-5.3c0-3.8,1.9-5.7,5.8-5.7h5.5l2.1,1.6v2.7h-7.4c-0.8,0-1.2,0.5-1.2,1.4c0,1,0.4,1.5,1.1,1.6l3.8,0.6c3,0.5,4.5,2.2,4.5,5.2c0,3.8-1.9,5.7-5.8,5.7h-6.3L791.3,50.3z"/>
      </g>

      {/* Left and right border bars */}
      <polygon fill="#FFBB00" stroke="#FFBB00" strokeWidth="3" strokeMiterlimit="10" points="26.5,62.3 17.5,62.3 17.5,27.3 26.5,19.3"/>
      <polygon fill="#FFBB00" stroke="#FFBB00" strokeWidth="3" strokeMiterlimit="10" points="1250.5,54.3 1241.5,61.3 1241.5,17.3 1250.5,17.3"/>
    </svg>
  );
};

  // Mobile SVG
  const MobileSVG = () => {
    // Calculate opacity for each tab's yellow fill
    // Use overlapping fade for smooth transition
    const libraryFillOpacity = fillProgress <= 50
      ? 1
      : Math.max(0, 1 - ((fillProgress - 50) / 30)); // Fade out from 50-80%

    const skillsFillOpacity = fillProgress >= 20
      ? Math.min(1, (fillProgress - 20) / 30) // Fade in from 20-50%
      : 0;

    return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 452 78"
      className="w-full h-full"
      style={{ enableBackground: 'new 0 0 452 78' } as any}
    >
      <defs>
        <style>{`
          .tab-outline {
            fill: none;
            stroke: #FFBB00;
            stroke-width: 3;
            stroke-miterlimit: 10;
          }
          .connector-line { fill: #FFFFFF; }
          .text-transition { transition: opacity 0.3s ease; }
        `}</style>
      </defs>

      {/* White connector lines */}
      <polygon
        className="connector-line"
        points="276,73.8 177,9.8 40.5,9.8 43.5,6.8 177.9,6.8 178.3,7 276.9,70.7 412.4,70.8 409.5,73.8"
      />

      {/* Tab outlines */}
      <polygon className="tab-outline" points="177.5,17.3 249.5,62.3 9.5,62.5 9.5,27.5 19.5,17.5" />
      <polygon className="tab-outline" points="204.5,17.3 276.5,62.3 433.5,62.5 443.5,52.2 443.5,17.5" />

      {/* Library tab yellow fill - fades out as we scroll to Skills */}
      <polygon
        fill="#FFBB00"
        points="177.5,17.3 249.5,62.3 9.5,62.5 9.5,27.5 19.5,17.5"
        style={{
          opacity: libraryFillOpacity,
          transition: scrollDirection ? 'none' : 'opacity 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)'
        }}
      />

      {/* Skills tab yellow fill - fades in as we scroll to Skills */}
      <polygon
        fill="#FFBB00"
        points="204.5,17.3 276.5,62.3 433.5,62.5 443.5,52.2 443.5,17.5"
        style={{
          opacity: skillsFillOpacity,
          transition: scrollDirection ? 'none' : 'opacity 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)'
        }}
      />

      {/* Clickable areas */}
      <polygon
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', fill: 'transparent' }}
        onClick={() => handleNavigate('library')}
        points="177.5,17.3 249.5,62.3 9.5,62.5 9.5,27.5 19.5,17.5"
      />
      <polygon
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', fill: 'transparent' }}
        onClick={() => handleNavigate('skills')}
        points="204.5,17.3 276.5,62.3 433.5,62.5 443.5,52.2 443.5,17.5"
      />

      {/* Library text - Black version */}
      <g onClick={() => handleNavigate('library')} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: libraryTextOpacity.black, transition: 'opacity 0.2s ease' }}>
        <path fill="#000000" d="M44.4,51.9V27.3h5.1v20h10.6v4.6H44.4z"/>
        <path fill="#000000" d="M63.5,29.9v-4.8h5.1v4.8H63.5z M63.6,51.9V33h4.9v18.8H63.6z"/>
        <path fill="#000000" d="M73.7,51.9V25.5h4.9V33h5.5c3.9,0,5.8,1.9,5.8,5.8v7.3c0,3.9-1.9,5.8-5.8,5.8H73.7z M78.6,47.6h5.2c0.8,0,1.1-0.4,1.1-1.1v-8c0-0.8-0.4-1.1-1.1-1.1h-5.2V47.6z"/>
        <path fill="#000000" d="M94.6,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7H101c-0.7,0-1.2,0.2-1.5,0.5v14H94.6z"/>
        <path fill="#000000" d="M113.6,51.9c-3.9,0-5.8-1.9-5.8-5.7s1.9-5.7,5.8-5.7h4.9v-2.1c0-0.8-0.4-1.1-1.1-1.1h-7.6v-2.7l2.1-1.6h5.7c3.9,0,5.8,1.9,5.8,5.8v13.1H113.6z M112.7,46.4c0,0.8,0.4,1.1,1.1,1.1h4.6v-3.3h-4.6c-0.8,0-1.1,0.4-1.1,1.1V46.4z"/>
        <path fill="#000000" d="M128.2,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7h-4.7c-0.7,0-1.2,0.2-1.5,0.5v14H128.2z"/>
        <path fill="#000000" d="M140.9,33.8l0.5-0.7h4.2l4.4,14.5h0.4l4.4-14.5h4.2l0.5,0.7L151.5,59h-4.2l-0.5-0.7l2.1-6.4h-2.4L140.9,33.8z"/>
      </g>

      {/* Library text - White version */}
      <g onClick={() => handleNavigate('library')} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: libraryTextOpacity.white, transition: 'opacity 0.2s ease' }}>
        <path fill="#FFFFFF" d="M44.4,51.9V27.3h5.1v20h10.6v4.6H44.4z"/>
        <path fill="#FFFFFF" d="M63.5,29.9v-4.8h5.1v4.8H63.5z M63.6,51.9V33h4.9v18.8H63.6z"/>
        <path fill="#FFFFFF" d="M73.7,51.9V25.5h4.9V33h5.5c3.9,0,5.8,1.9,5.8,5.8v7.3c0,3.9-1.9,5.8-5.8,5.8H73.7z M78.6,47.6h5.2c0.8,0,1.1-0.4,1.1-1.1v-8c0-0.8-0.4-1.1-1.1-1.1h-5.2V47.6z"/>
        <path fill="#FFFFFF" d="M94.6,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7H101c-0.7,0-1.2,0.2-1.5,0.5v14H94.6z"/>
        <path fill="#FFFFFF" d="M113.6,51.9c-3.9,0-5.8-1.9-5.8-5.7s1.9-5.7,5.8-5.7h4.9v-2.1c0-0.8-0.4-1.1-1.1-1.1h-7.6v-2.7l2.1-1.6h5.7c3.9,0,5.8,1.9,5.8,5.8v13.1H113.6z M112.7,46.4c0,0.8,0.4,1.1,1.1,1.1h4.6v-3.3h-4.6c-0.8,0-1.1,0.4-1.1,1.1V46.4z"/>
        <path fill="#FFFFFF" d="M128.2,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7h-4.7c-0.7,0-1.2,0.2-1.5,0.5v14H128.2z"/>
        <path fill="#FFFFFF" d="M140.9,33.8l0.5-0.7h4.2l4.4,14.5h0.4l4.4-14.5h4.2l0.5,0.7L151.5,59h-4.2l-0.5-0.7l2.1-6.4h-2.4L140.9,33.8z"/>
      </g>

      {/* Skills text - White version */}
      <g onClick={() => handleNavigate('skills')} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: skillsTextOpacity.white, transition: 'opacity 0.2s ease' }}>
        <path fill="#FFFFFF" d="M303.4,50v-2.8h11.1c0.7,0,1.1-0.4,1.1-1.1v-2.6c0-0.7-0.3-1.1-0.9-1.2l-7-1.4c-2.9-0.6-4.3-2.5-4.3-5.7v-2c0-4,2-6,6-6h8.2l2.4,1.9v2.8h-10.3c-0.7,0-1.1,0.4-1.1,1.1v2.3c0,0.7,0.3,1.1,0.9,1.2l7,1.4c2.9,0.6,4.3,2.5,4.3,5.7v2.3c0,4-2,6-6,6h-8.9L303.4,50z"/>
        <path fill="#FFFFFF" d="M325.1,51.9V25.5h4.9v14.7l6.5-7.1h4.8l0.4,0.8l-6.5,7l7,10.2l-0.4,0.8H337l-5.1-7.5l-2,2.2v5.3H325.1z"/>
        <path fill="#FFFFFF" d="M345.6,29.9v-4.8h5.1v4.8H345.6z M345.7,51.9V33h4.9v18.8H345.7z"/>
        <path fill="#FFFFFF" d="M355.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C358.1,52.2,355.7,49.8,355.7,45z"/>
        <path fill="#FFFFFF" d="M366.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C369.1,52.2,366.7,49.8,366.7,45z"/>
        <path fill="#FFFFFF" d="M377.3,50.3v-2.7h8.2c0.8,0,1.2-0.5,1.2-1.4c0-0.9-0.3-1.4-1-1.6l-3.9-0.6c-3-0.5-4.6-2.3-4.6-5.3c0-3.8,1.9-5.7,5.8-5.7h5.5l2.1,1.6v2.7h-7.4c-0.8,0-1.2,0.5-1.2,1.4c0,1,0.4,1.5,1.1,1.6l3.8,0.6c3,0.5,4.5,2.2,4.5,5.2c0,3.8-1.9,5.7-5.8,5.7h-6.3L377.3,50.3z"/>
      </g>

      {/* Skills text - Black version */}
      <g onClick={() => handleNavigate('skills')} style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: skillsTextOpacity.black, transition: 'opacity 0.2s ease' }}>
        <path fill="#000000" d="M303.4,50v-2.8h11.1c0.7,0,1.1-0.4,1.1-1.1v-2.6c0-0.7-0.3-1.1-0.9-1.2l-7-1.4c-2.9-0.6-4.3-2.5-4.3-5.7v-2c0-4,2-6,6-6h8.2l2.4,1.9v2.8h-10.3c-0.7,0-1.1,0.4-1.1,1.1v2.3c0,0.7,0.3,1.1,0.9,1.2l7,1.4c2.9,0.6,4.3,2.5,4.3,5.7v2.3c0,4-2,6-6,6h-8.9L303.4,50z"/>
        <path fill="#000000" d="M325.1,51.9V25.5h4.9v14.7l6.5-7.1h4.8l0.4,0.8l-6.5,7l7,10.2l-0.4,0.8H337l-5.1-7.5l-2,2.2v5.3H325.1z"/>
        <path fill="#000000" d="M345.6,29.9v-4.8h5.1v4.8H345.6z M345.7,51.9V33h4.9v18.8H345.7z"/>
        <path fill="#000000" d="M355.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C358.1,52.2,355.7,49.8,355.7,45z"/>
        <path fill="#000000" d="M366.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C369.1,52.2,366.7,49.8,366.7,45z"/>
        <path fill="#000000" d="M377.3,50.3v-2.7h8.2c0.8,0,1.2-0.5,1.2-1.4c0-0.9-0.3-1.4-1-1.6l-3.9-0.6c-3-0.5-4.6-2.3-4.6-5.3c0-3.8,1.9-5.7,5.8-5.7h5.5l2.1,1.6v2.7h-7.4c-0.8,0-1.2,0.5-1.2,1.4c0,1,0.4,1.5,1.1,1.6l3.8,0.6c3,0.5,4.5,2.2,4.5,5.2c0,3.8-1.9,5.7-5.8,5.7h-6.3L377.3,50.3z"/>
      </g>
    </svg>
  );
};


  return (
    <div className={cn("w-full bg-black", className)}>
      <div className="w-full h-20 flex items-center justify-between px-6">
        {/* Logo - Left */}
        <Link
          href="/"
          className="flex-shrink-0 hover:scale-105 transition-transform"
        >
          <div className="w-10 h-10 flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="NRGHAX Logo"
              width={40}
              height={40}
              className="drop-shadow-[0_0_20px_rgba(253,181,21,0.5)]"
              style={{ filter: 'drop-shadow(0 0 20px rgba(253, 181, 21, 0.5))' }}
            />
          </div>
        </Link>

        {/* Tabs - Center */}
        <div className="flex-1 h-20 max-w-6xl mx-auto">
          {isMobile ? <MobileSVG /> : <DesktopSVG />}
        </div>

        {/* User Icon - Right */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 border-2 border-yellow-400 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(253,181,21,0.5)] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || 'User'}
                    width={38}
                    height={38}
                    className="rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5 text-yellow-400" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-yellow-400/20">
              <DropdownMenuLabel className="text-yellow-400">
                {user?.name || user?.email || 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-yellow-400/20" />
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-white">
                <Link href="/profile" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-yellow-400/20" />
                  <DropdownMenuLabel className="text-yellow-400 flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-white">
                    <Link href="/admin" className="flex items-center">
                      <Database className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-white">
                    <Link href="/admin/hacks/new" className="flex items-center">
                      <Database className="mr-2 h-4 w-4" />
                      <span>Manage Hacks</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-white">
                    <Link href="/admin/routines" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Manage Routines</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-white">
                    <Link href="/admin/tags" className="flex items-center">
                      <Tag className="mr-2 h-4 w-4" />
                      <span>Manage Tags</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator className="bg-yellow-400/20" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800 text-red-400 focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/auth"
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 border-2 border-yellow-400 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(253,181,21,0.5)]"
          >
            <User className="h-5 w-5 text-yellow-400" />
          </Link>
        )}
      </div>
    </div>
  );
}
