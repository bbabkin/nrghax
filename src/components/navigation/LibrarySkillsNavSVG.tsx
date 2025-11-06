'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LibrarySkillsNavSVGProps {
  className?: string;
}

export function LibrarySkillsNavSVG({ className }: LibrarySkillsNavSVGProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Determine current view based on pathname
  const currentView = pathname.startsWith('/skills') ? 'skills' : 'library';
  const isLibraryActive = currentView === 'library';

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
    if (view === 'library') {
      router.push('/library');
    } else {
      router.push('/skills');
    }
  };

  // Desktop SVG
  const DesktopSVG = () => (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1266 78"
      className="w-full h-full transition-all duration-300"
      style={{ enableBackground: 'new 0 0 1266 78' } as any}
    >
      <defs>
        <style>{`
          .tab-active { fill: #FFBB00; stroke: #FFBB00; stroke-width: 3; stroke-miterlimit: 10; transition: all 0.3s ease; }
          .tab-inactive { fill: none; stroke: #FFBB00; stroke-width: 3; stroke-miterlimit: 10; transition: all 0.3s ease; }
          .text-white { fill: #FFFFFF; transition: fill 0.3s ease; }
          .text-black { fill: #000000; transition: fill 0.3s ease; }
          .connector-line { fill: #FFFFFF; }
        `}</style>
      </defs>

      {/* White connector lines */}
      <polygon
        className="connector-line"
        points="683,73.8 584,9.8 341.5,9.8 344.5,6.8 584.9,6.8 585.3,7 683.9,70.7 926.4,70.8 923.5,73.8"
      />

      {/* Library tab */}
      <polygon
        className={isLibraryActive ? 'tab-active' : 'tab-inactive'}
        points="584.5,17.3 656.5,62.3 35.5,62.3 35.5,17.3"
        style={{ cursor: 'pointer' }}
        onClick={() => handleNavigate('library')}
      />

      {/* Skills tab */}
      <polygon
        className={isLibraryActive ? 'tab-inactive' : 'tab-active'}
        points="611.5,17.3 683.5,62.3 1232.5,62.3 1232.5,17.3"
        style={{ cursor: 'pointer' }}
        onClick={() => handleNavigate('skills')}
      />

      {/* Library text */}
      <g onClick={() => handleNavigate('library')} style={{ cursor: 'pointer' }}>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M441.4,51.9V27.3h5.1v20h10.6v4.6H441.4z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M460.5,29.9v-4.8h5.1v4.8H460.5z M460.6,51.9V33h4.9v18.8H460.6z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M470.7,51.9V25.5h4.9V33h5.5c3.9,0,5.8,1.9,5.8,5.8v7.3c0,3.9-1.9,5.8-5.8,5.8H470.7z M475.6,47.6h5.2c0.8,0,1.1-0.4,1.1-1.1v-8c0-0.8-0.4-1.1-1.1-1.1h-5.2V47.6z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M491.6,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7H498c-0.7,0-1.2,0.2-1.5,0.5v14H491.6z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M510.6,51.9c-3.9,0-5.8-1.9-5.8-5.7s1.9-5.7,5.8-5.7h4.9v-2.1c0-0.8-0.4-1.1-1.1-1.1h-7.6v-2.7l2.1-1.6h5.7c3.9,0,5.8,1.9,5.8,5.8v13.1H510.6z M509.7,46.4c0,0.8,0.4,1.1,1.1,1.1h4.6v-3.3h-4.6c-0.8,0-1.1,0.4-1.1,1.1V46.4z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M525.2,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7h-4.7c-0.7,0-1.2,0.2-1.5,0.5v14H525.2z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M537.9,33.8l0.5-0.7h4.2l4.4,14.5h0.4l4.4-14.5h4.2l0.5,0.7L548.5,59h-4.2l-0.5-0.7l2.1-6.4h-2.4L537.9,33.8z"/>
      </g>

      {/* Skills text */}
      <g onClick={() => handleNavigate('skills')} style={{ cursor: 'pointer' }}>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M717.4,50v-2.8h11.1c0.7,0,1.1-0.4,1.1-1.1v-2.6c0-0.7-0.3-1.1-0.9-1.2l-7-1.4c-2.9-0.6-4.3-2.5-4.3-5.7v-2c0-4,2-6,6-6h8.2l2.4,1.9v2.8h-10.3c-0.7,0-1.1,0.4-1.1,1.1v2.3c0,0.7,0.3,1.1,0.9,1.2l7,1.4c2.9,0.6,4.3,2.5,4.3,5.7v2.3c0,4-2,6-6,6h-8.9L717.4,50z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M739.1,51.9V25.5h4.9v14.7l6.5-7.1h4.8l0.4,0.8l-6.5,7l7,10.2l-0.4,0.8H751l-5.1-7.5l-2,2.2v5.3H739.1z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M759.6,29.9v-4.8h5.1v4.8H759.6z M759.7,51.9V33h4.9v18.8H759.7z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M769.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C772.1,52.2,769.7,49.8,769.7,45z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M780.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C783.1,52.2,780.7,49.8,780.7,45z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M791.3,50.3v-2.7h8.2c0.8,0,1.2-0.5,1.2-1.4c0-0.9-0.3-1.4-1-1.6l-3.9-0.6c-3-0.5-4.6-2.3-4.6-5.3c0-3.8,1.9-5.7,5.8-5.7h5.5l2.1,1.6v2.7h-7.4c-0.8,0-1.2,0.5-1.2,1.4c0,1,0.4,1.5,1.1,1.6l3.8,0.6c3,0.5,4.5,2.2,4.5,5.2c0,3.8-1.9,5.7-5.8,5.7h-6.3L791.3,50.3z"/>
      </g>

      {/* Left and right border bars */}
      <polygon className="tab-active" points="26.5,62.3 17.5,62.3 17.5,27.3 26.5,19.3"/>
      <polygon className="tab-inactive" points="1250.5,54.3 1241.5,61.3 1241.5,17.3 1250.5,17.3"/>
    </svg>
  );

  // Mobile SVG
  const MobileSVG = () => (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 490 78"
      className="w-full h-full transition-all duration-300"
      style={{ enableBackground: 'new 0 0 490 78' } as any}
    >
      <defs>
        <style>{`
          .tab-active { fill: #FFBB00; stroke: #FFBB00; stroke-width: 3; stroke-miterlimit: 10; transition: all 0.3s ease; }
          .tab-inactive { fill: none; stroke: #FFBB00; stroke-width: 3; stroke-miterlimit: 10; transition: all 0.3s ease; }
          .text-white { fill: #FFFFFF; transition: fill 0.3s ease; }
          .text-black { fill: #000000; transition: fill 0.3s ease; }
          .connector-line { fill: #FFFFFF; }
        `}</style>
      </defs>

      {/* White connector lines */}
      <polygon
        className="connector-line"
        points="295,73.8 196,9.8 59.5,9.8 62.5,6.8 196.9,6.8 197.3,7 295.9,70.7 431.4,70.8 428.5,73.8"
      />

      {/* Library tab */}
      <polygon
        className={isLibraryActive ? 'tab-active' : 'tab-inactive'}
        points="196.5,17.3 268.5,62.3 28.5,62.5 28.5,17.5"
        style={{ cursor: 'pointer' }}
        onClick={() => handleNavigate('library')}
      />

      {/* Skills tab */}
      <polygon
        className={isLibraryActive ? 'tab-inactive' : 'tab-active'}
        points="223.5,17.3 295.5,62.3 462.5,62.5 462.5,17.5"
        style={{ cursor: 'pointer' }}
        onClick={() => handleNavigate('skills')}
      />

      {/* Library text */}
      <g onClick={() => handleNavigate('library')} style={{ cursor: 'pointer' }}>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M63.4,51.9V27.3h5.1v20h10.6v4.6H63.4z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M82.5,29.9v-4.8h5.1v4.8H82.5z M82.6,51.9V33h4.9v18.8H82.6z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M92.7,51.9V25.5h4.9V33h5.5c3.9,0,5.8,1.9,5.8,5.8v7.3c0,3.9-1.9,5.8-5.8,5.8H92.7z M97.6,47.6h5.2c0.8,0,1.1-0.4,1.1-1.1v-8c0-0.8-0.4-1.1-1.1-1.1h-5.2V47.6z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M113.6,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7H120c-0.7,0-1.2,0.2-1.5,0.5v14H113.6z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M132.6,51.9c-3.9,0-5.8-1.9-5.8-5.7s1.9-5.7,5.8-5.7h4.9v-2.1c0-0.8-0.4-1.1-1.1-1.1h-7.6v-2.7l2.1-1.6h5.7c3.9,0,5.8,1.9,5.8,5.8v13.1H132.6z M131.7,46.4c0,0.8,0.4,1.1,1.1,1.1h4.6v-3.3h-4.6c-0.8,0-1.1,0.4-1.1,1.1V46.4z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M147.2,51.9V35.5c0.9-1.6,2.6-2.4,5.1-2.4h3.9l2.1,1.6v2.7h-4.7c-0.7,0-1.2,0.2-1.5,0.5v14H147.2z"/>
        <path className={isLibraryActive ? 'text-black' : 'text-white'} d="M159.9,33.8l0.5-0.7h4.2l4.4,14.5h0.4l4.4-14.5h4.2l0.5,0.7L170.5,59h-4.2l-0.5-0.7l2.1-6.4h-2.4L159.9,33.8z"/>
      </g>

      {/* Skills text */}
      <g onClick={() => handleNavigate('skills')} style={{ cursor: 'pointer' }}>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M322.4,50v-2.8h11.1c0.7,0,1.1-0.4,1.1-1.1v-2.6c0-0.7-0.3-1.1-0.9-1.2l-7-1.4c-2.9-0.6-4.3-2.5-4.3-5.7v-2c0-4,2-6,6-6h8.2l2.4,1.9v2.8h-10.3c-0.7,0-1.1,0.4-1.1,1.1v2.3c0,0.7,0.3,1.1,0.9,1.2l7,1.4c2.9,0.6,4.3,2.5,4.3,5.7v2.3c0,4-2,6-6,6h-8.9L322.4,50z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M344.1,51.9V25.5h4.9v14.7l6.5-7.1h4.8l0.4,0.8l-6.5,7l7,10.2l-0.4,0.8H356l-5.1-7.5l-2,2.2v5.3H344.1z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M364.6,29.9v-4.8h5.1v4.8H364.6z M364.7,51.9V33h4.9v18.8H364.7z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M374.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C377.1,52.2,374.7,49.8,374.7,45z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M385.7,45V25.5h4.9v20c0,1.5,0.8,2.3,2.3,2.4v4.3C388.1,52.2,385.7,49.8,385.7,45z"/>
        <path className={isLibraryActive ? 'text-white' : 'text-black'} d="M396.3,50.3v-2.7h8.2c0.8,0,1.2-0.5,1.2-1.4c0-0.9-0.3-1.4-1-1.6l-3.9-0.6c-3-0.5-4.6-2.3-4.6-5.3c0-3.8,1.9-5.7,5.8-5.7h5.5l2.1,1.6v2.7h-7.4c-0.8,0-1.2,0.5-1.2,1.4c0,1,0.4,1.5,1.1,1.6l3.8,0.6c3,0.5,4.5,2.2,4.5,5.2c0,3.8-1.9,5.7-5.8,5.7h-6.3L396.3,50.3z"/>
      </g>

      {/* Left and right border bars */}
      <polygon className="tab-active" points="19.5,62.5 10.5,62.5 10.5,27.5 19.5,19.5"/>
      <polygon className="tab-inactive" points="480.5,54.5 471.5,61.5 471.5,17.5 480.5,17.5"/>
    </svg>
  );

  return (
    <div className={cn("w-full bg-black", className)}>
      <div className="w-full max-w-7xl mx-auto">
        <div className="relative h-20">
          {isMobile ? <MobileSVG /> : <DesktopSVG />}
        </div>
      </div>
    </div>
  );
}
