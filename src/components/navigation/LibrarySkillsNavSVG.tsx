'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';

interface LibrarySkillsNavSVGProps {
  className?: string;
  isAuthenticated?: boolean;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export function LibrarySkillsNavSVG({ className, isAuthenticated, user }: LibrarySkillsNavSVGProps) {
  const pathname = usePathname();

  // Determine current view based on pathname
  const isSkillsActive = pathname.startsWith('/skills');
  const isLibraryActive = pathname === '/library' || pathname.startsWith('/library/');

  return (
    <div className={cn("w-full bg-white border-b border-gray-200", className)}>
      <div className="w-full max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <Link
            href="/"
            className="hover:scale-105 transition-transform flex-shrink-0"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="NRGHAX Logo"
                width={48}
                height={48}
                className="drop-shadow-[0_0_5px_rgba(253,181,21,0.3)]"
              />
            </div>
          </Link>

          {/* Simple Text Navigation - Center */}
          <nav className="flex items-center gap-8">
            <Link
              href="/library"
              className={cn(
                "relative py-2 text-lg font-light tracking-wide transition-colors",
                isLibraryActive
                  ? "text-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Library
              {isLibraryActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
              )}
            </Link>
            <Link
              href="/skills"
              className={cn(
                "relative py-2 text-lg font-light tracking-wide transition-colors",
                isSkillsActive
                  ? "text-yellow-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              Skills
              {isSkillsActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500" />
              )}
            </Link>
          </nav>

          {/* User Icon - Right */}
          <Link
            href={isAuthenticated ? '/dashboard' : '/auth'}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || 'User'}
                width={36}
                height={36}
                className="rounded-full"
              />
            ) : (
              <User className="h-5 w-5 text-gray-600" />
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
