'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Clock, Zap, Users } from 'lucide-react';
import type { Tables } from '@/types/supabase';

interface RoutineCardProps {
  routine: Tables<'routines'> & {
    profile?: {
      username: string;
      avatar_url?: string;
    };
  };
  isOwner?: boolean;
  className?: string;
  onEdit?: (routineId: number) => void;
  onDelete?: (routineId: number) => void;
}

/**
 * Optimized RoutineCard component with memoization
 * Includes stacked card effect and performance optimizations
 */
export const RoutineCard = memo(function RoutineCard({
  routine,
  isOwner = false,
  className = '',
  onEdit,
  onDelete
}: RoutineCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(routine.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(routine.id);
  };

  // Determine difficulty color
  const getDifficultyColor = () => {
    const difficulty = routine.routine_difficulty || 1;
    if (difficulty <= 2) return 'text-green-500';
    if (difficulty <= 3) return 'text-yellow-500';
    if (difficulty <= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  // Determine energy color gradient
  const getEnergyGradient = () => {
    const energy = routine.routine_energy_level || 1;
    if (energy <= 2) return 'from-blue-500 to-cyan-500';
    if (energy <= 3) return 'from-green-500 to-emerald-500';
    if (energy <= 4) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <Link
      href={`/routines/${routine.id}`}
      className={`block relative group ${className}`}
      aria-label={`View routine: ${routine.routine_name}`}
    >
      {/* Stacked cards effect */}
      <div className="relative">
        {/* Back card layers */}
        <div
          className="absolute inset-0 bg-zinc-800 rounded-lg transform translate-y-2 translate-x-2 opacity-40"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-zinc-850 rounded-lg transform translate-y-1 translate-x-1 opacity-60"
          aria-hidden="true"
        />

        {/* Main card */}
        <div
          className="relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-yellow-500/50 hover:transform hover:scale-105"
          style={{
            clipPath: 'polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)'
          }}
        >
          {/* Energy level gradient header */}
          <div className={`h-2 bg-gradient-to-r ${getEnergyGradient()}`} />

          {/* Diagonal stripes pattern */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255, 255, 255, 0.1) 10px,
                rgba(255, 255, 255, 0.1) 20px
              )`
            }}
            aria-hidden="true"
          />

          <div className="p-4 relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-white group-hover:text-yellow-500 transition-colors line-clamp-1 flex-1">
                {routine.routine_name}
              </h3>

              {/* Owner actions */}
              {isOwner && (
                <div className="flex gap-1 ml-2">
                  {onEdit && (
                    <button
                      onClick={handleEdit}
                      className="p-1 text-zinc-500 hover:text-yellow-500 transition-colors"
                      aria-label="Edit routine"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className="p-1 text-zinc-500 hover:text-red-500 transition-colors"
                      aria-label="Delete routine"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
              {routine.routine_description || 'No description available'}
            </p>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              {/* Duration */}
              {routine.routine_duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{routine.routine_duration}min</span>
                </div>
              )}

              {/* Energy Level */}
              {routine.routine_energy_level && (
                <div className="flex items-center gap-1">
                  <Zap className={`w-3 h-3 ${getDifficultyColor()}`} />
                  <span className={getDifficultyColor()}>
                    Level {routine.routine_energy_level}
                  </span>
                </div>
              )}

              {/* Creator */}
              {routine.profile?.username && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">
                    {routine.profile.username}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {routine.routine_tags && routine.routine_tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {routine.routine_tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {routine.routine_tags.length > 3 && (
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                    +{routine.routine_tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.routine.id === nextProps.routine.id &&
    prevProps.routine.updated_at === nextProps.routine.updated_at &&
    prevProps.isOwner === nextProps.isOwner &&
    prevProps.className === nextProps.className
  );
});