'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Library, BookOpen } from 'lucide-react';

interface LibrarySkillsNavProps {
  className?: string;
}

export function LibrarySkillsNav({ className }: LibrarySkillsNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine current view based on pathname
  const currentView = pathname.startsWith('/levels') ? 'skills' : 'library';

  const handleNavigate = (view: 'library' | 'skills') => {
    if (view === 'library') {
      router.push('/hacks');
    } else {
      router.push('/levels');
    }
  };

  // Determine position based on current view
  const position = currentView === 'library' ? 'top' : 'bottom';

  return (
    <motion.div
      initial={false}
      animate={{
        top: position === 'top' ? '0px' : 'auto',
        bottom: position === 'bottom' ? '0px' : 'auto',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      className={cn(
        "fixed left-0 right-0 z-50 bg-black",
        className
      )}
    >
      <div
        className="bg-gray-900 overflow-hidden"
        style={{
          clipPath: 'polygon(30px 0, 100% 0, 100% 100%, 0 100%, 0 30px)'
        }}
      >
        <div className="flex h-20">
          {/* Library Button */}
          <button
            onClick={() => handleNavigate('library')}
            className={cn(
              "flex-1 flex items-center justify-center gap-3 font-bold text-2xl transition-all duration-300 relative uppercase tracking-wider",
              currentView === 'library'
                ? 'bg-yellow-400 text-black shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]'
                : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
            )}
            style={{
              clipPath: currentView === 'library'
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                : 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 0 100%)'
            }}
          >
            <Library className="h-7 w-7" />
            <span>Library</span>
          </button>

          {/* Skills Button */}
          <button
            onClick={() => handleNavigate('skills')}
            className={cn(
              "flex-1 flex items-center justify-center gap-3 font-bold text-2xl transition-all duration-300 relative uppercase tracking-wider",
              currentView === 'skills'
                ? 'bg-yellow-400 text-black shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]'
                : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
            )}
            style={{
              clipPath: currentView === 'skills'
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                : 'polygon(20px 0, 100% 0, 100% 100%, 0 100%)'
            }}
          >
            <BookOpen className="h-7 w-7" />
            <span>Skills</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}