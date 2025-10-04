'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import '@/styles/glitch.css';

interface GlitchCTAProps {
  href: string;
  text: string;
  showArrow?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function GlitchCTA({
  href,
  text,
  showArrow = true,
  className = '',
  variant = 'primary'
}: GlitchCTAProps) {
  const baseClasses = variant === 'primary'
    ? 'inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-300 shadow-lg shadow-pink-500/25 glitch-cta-wrapper group'
    : 'inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold border-white/20 bg-white/10 text-white backdrop-blur-md rounded-full transition-all duration-300 group';

  return (
    <Link href={href} className={`${baseClasses} ${className}`}>
      <span className="glitch-cta" data-text={text}>
        {text}
      </span>
      {showArrow && (
        <span className="text-2xl group-hover:translate-x-1 transition-transform">
          →
        </span>
      )}
    </Link>
  );
}