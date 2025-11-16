import React from 'react';

/**
 * Loading skeleton components for better perceived performance
 */

export function HackCardSkeleton() {
  return (
    <div className="relative group">
      <div
        className="relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-pulse"
        style={{
          clipPath: 'polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)'
        }}
      >
        {/* Image skeleton */}
        <div className="h-48 bg-zinc-800" />

        {/* Content skeleton */}
        <div className="p-4">
          <div className="h-6 bg-zinc-800 rounded mb-2" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded" />
            <div className="h-4 bg-zinc-800 rounded w-3/4" />
          </div>

          {/* Tags skeleton */}
          <div className="mt-3 flex gap-1">
            <div className="h-5 w-12 bg-zinc-800 rounded" />
            <div className="h-5 w-16 bg-zinc-800 rounded" />
            <div className="h-5 w-14 bg-zinc-800 rounded" />
          </div>

          {/* Difficulty skeleton */}
          <div className="mt-3 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-1 w-8 bg-zinc-800 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoutineCardSkeleton() {
  return (
    <div className="relative">
      {/* Stacked cards effect */}
      <div className="absolute inset-0 bg-zinc-800 rounded-lg transform translate-y-2 translate-x-2 opacity-40" />
      <div className="absolute inset-0 bg-zinc-850 rounded-lg transform translate-y-1 translate-x-1 opacity-60" />

      {/* Main card */}
      <div
        className="relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-pulse"
        style={{
          clipPath: 'polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)'
        }}
      >
        {/* Energy gradient skeleton */}
        <div className="h-2 bg-zinc-800" />

        <div className="p-4">
          {/* Header skeleton */}
          <div className="h-6 bg-zinc-800 rounded mb-3" />

          {/* Description skeleton */}
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-zinc-800 rounded" />
            <div className="h-4 bg-zinc-800 rounded w-3/4" />
          </div>

          {/* Meta info skeleton */}
          <div className="flex gap-4 mb-3">
            <div className="h-3 w-16 bg-zinc-800 rounded" />
            <div className="h-3 w-12 bg-zinc-800 rounded" />
            <div className="h-3 w-20 bg-zinc-800 rounded" />
          </div>

          {/* Tags skeleton */}
          <div className="flex gap-1">
            <div className="h-5 w-14 bg-zinc-800 rounded" />
            <div className="h-5 w-16 bg-zinc-800 rounded" />
            <div className="h-5 w-12 bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkillTreeSkeleton() {
  return (
    <div className="relative w-full max-w-4xl mx-auto p-8">
      <div className="space-y-24">
        {/* Level skeleton */}
        {[...Array(3)].map((_, levelIndex) => (
          <div key={levelIndex} className="relative">
            {/* Level header */}
            <div className="text-center mb-8">
              <div className="h-8 w-48 bg-zinc-800 rounded mx-auto mb-2 animate-pulse" />
              <div className="h-4 w-32 bg-zinc-800 rounded mx-auto animate-pulse" />
            </div>

            {/* Hacks in level */}
            <div className="space-y-8">
              {[...Array(3)].map((_, hackIndex) => (
                <div key={hackIndex} className="relative">
                  {/* Connection line */}
                  {hackIndex > 0 && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 w-0.5 h-8 bg-zinc-800" />
                  )}

                  {/* Hack card skeleton */}
                  <div className="max-w-md mx-auto">
                    <HackCardSkeleton />
                  </div>
                </div>
              ))}
            </div>

            {/* Level connector */}
            {levelIndex < 2 && (
              <div className="relative mt-12">
                <div className="h-16 w-1 bg-gradient-to-b from-zinc-800 via-yellow-500/20 to-zinc-800 mx-auto" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LibraryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(12)].map((_, i) => (
        <HackCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RoutinesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <RoutineCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 bg-zinc-800 rounded-full" />
      <div className="space-y-1">
        <div className="h-4 w-24 bg-zinc-800 rounded" />
        <div className="h-3 w-16 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}

export function SearchBarSkeleton() {
  return (
    <div className="relative">
      <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />
    </div>
  );
}

export function TabsSkeleton() {
  return (
    <div className="flex gap-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-10 w-24 bg-zinc-800 rounded animate-pulse"
        />
      ))}
    </div>
  );
}