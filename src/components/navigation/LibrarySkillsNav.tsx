'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LibrarySkillsNavProps {
  className?: string;
}

export function LibrarySkillsNav({ className }: LibrarySkillsNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine current view based on pathname
  const currentView = pathname.startsWith('/skills') ? 'skills' : 'library';

  const handleNavigate = (view: 'library' | 'skills') => {
    if (view === 'library') {
      router.push('/library');
    } else {
      router.push('/skills');
    }
  };

  return (
    <div className={cn("fixed top-16 left-0 right-0 z-40 bg-black", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 relative">
          {/* Library Tab */}
          <button
            onClick={() => handleNavigate('library')}
            className="relative flex-1 h-full"
            style={{ maxWidth: '50%' }}
          >
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center font-bold text-lg uppercase tracking-wider transition-all duration-300",
                currentView === 'library'
                  ? "text-black z-20"
                  : "text-white z-10"
              )}
            >
              Library
            </div>
            {/* Active Library Background */}
            {currentView === 'library' && (
              <div
                className="absolute inset-0 bg-[#FDB515]"
                style={{
                  clipPath: 'polygon(0 0, calc(100% + 30px) 0, 100% 100%, 0 100%)',
                }}
              />
            )}
            {/* Inactive Library Border */}
            {currentView !== 'library' && (
              <div
                className="absolute inset-0 border-2 border-white"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 30px) 0, calc(100% - 60px) 100%, 0 100%)',
                  background: 'transparent'
                }}
              />
            )}
          </button>

          {/* Skills Tab */}
          <button
            onClick={() => handleNavigate('skills')}
            className="relative flex-1 h-full"
            style={{ maxWidth: '50%' }}
          >
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center font-bold text-lg uppercase tracking-wider transition-all duration-300",
                currentView === 'skills'
                  ? "text-black z-20"
                  : "text-white z-10"
              )}
            >
              Skills
            </div>
            {/* Active Skills Background */}
            {currentView === 'skills' && (
              <div
                className="absolute inset-0 bg-[#FDB515]"
                style={{
                  clipPath: 'polygon(30px 0, 100% 0, 100% 100%, 0 100%)',
                  marginLeft: '-30px'
                }}
              />
            )}
            {/* Inactive Skills Border */}
            {currentView !== 'skills' && (
              <div
                className="absolute inset-0 border-2 border-white"
                style={{
                  clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 30px 100%)',
                  background: 'transparent'
                }}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}