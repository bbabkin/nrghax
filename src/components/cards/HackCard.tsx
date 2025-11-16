'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Lock } from 'lucide-react';
import type { Tables } from '@/types/supabase';

interface HackCardProps {
  hack: Tables<'hacks'>;
  isCompleted: boolean;
  isUnlocked: boolean;
  completedCount: number;
  isCurrentLevel?: boolean;
  className?: string;
  onComplete?: (hackId: number) => void;
}

/**
 * Optimized HackCard component with memoization
 * Only re-renders when props actually change
 */
export const HackCard = memo(function HackCard({
  hack,
  isCompleted,
  isUnlocked,
  completedCount,
  isCurrentLevel = false,
  className = '',
  onComplete
}: HackCardProps) {
  // Determine glow effect based on completion count
  const getGlowEffect = () => {
    if (!isCompleted) return '';
    if (completedCount === 1) return 'shadow-green-500/50';
    if (completedCount === 2) return 'shadow-blue-500/50';
    if (completedCount === 3) return 'shadow-purple-500/50';
    return 'shadow-orange-500/50';
  };

  // Determine badge color
  const getBadgeClass = () => {
    if (!isCompleted) return '';
    if (completedCount === 1) return 'bg-green-500';
    if (completedCount === 2) return 'bg-blue-500';
    if (completedCount === 3) return 'bg-purple-500';
    return 'bg-orange-500';
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isUnlocked) {
      e.preventDefault();
      return;
    }
  };

  const cardContent = (
    <div
      className={`
        relative group transition-all duration-300
        ${isUnlocked ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60'}
        ${className}
      `}
    >
      <div
        className={`
          relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden
          ${isCompleted ? `shadow-lg ${getGlowEffect()}` : ''}
          ${isUnlocked ? 'hover:border-yellow-500/50' : ''}
        `}
        style={{
          clipPath: 'polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)'
        }}
      >
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden bg-zinc-950">
          {hack.hack_image ? (
            <Image
              src={hack.hack_image}
              alt={hack.hack_name}
              fill
              className={`object-cover ${!isUnlocked ? 'grayscale' : ''}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={isCurrentLevel}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
          )}

          {/* Lock Overlay */}
          {!isUnlocked && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Lock className="w-12 h-12 text-zinc-500" />
            </div>
          )}

          {/* Completion Badge */}
          {isCompleted && completedCount > 0 && (
            <div
              className={`
                absolute top-3 right-3 w-8 h-8 rounded-full
                flex items-center justify-center text-white text-sm font-bold
                ${getBadgeClass()}
              `}
            >
              {completedCount === 1 && <Check className="w-5 h-5" />}
              {completedCount > 1 && completedCount}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 text-white group-hover:text-yellow-500 transition-colors">
            {hack.hack_name}
          </h3>
          <p className="text-zinc-400 text-sm line-clamp-2">
            {hack.hack_description}
          </p>

          {/* Tags */}
          {hack.hack_tags && hack.hack_tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {hack.hack_tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Difficulty Indicator */}
          {hack.hack_difficulty && (
            <div className="mt-3 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`
                    h-1 w-8 rounded-full
                    ${i < hack.hack_difficulty ? 'bg-yellow-500' : 'bg-zinc-800'}
                  `}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If unlocked, wrap in Link, otherwise just return the card
  if (isUnlocked) {
    return (
      <Link
        href={`/hacks/${hack.id}`}
        onClick={handleClick}
        className="block"
        aria-label={`View hack: ${hack.hack_name}`}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these specific props change
  return (
    prevProps.hack.id === nextProps.hack.id &&
    prevProps.isCompleted === nextProps.isCompleted &&
    prevProps.isUnlocked === nextProps.isUnlocked &&
    prevProps.completedCount === nextProps.completedCount &&
    prevProps.isCurrentLevel === nextProps.isCurrentLevel &&
    prevProps.className === nextProps.className
  );
});