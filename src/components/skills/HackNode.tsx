'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import Image from 'next/image';
import { Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getProgressionColor,
  getProgressionClasses,
  formatCompletionCount
} from '@/lib/progression';

interface HackNodeProps {
  data: {
    hack: {
      id: string;
      name: string;
      description: string;
      image_url: string;
      duration_minutes?: number;
      completion_count?: number;
      tags?: Array<{ name: string }>;
      is_locked?: boolean;
    };
  };
  selected?: boolean;
}

export const HackNode = memo(({ data, selected }: HackNodeProps) => {
  const { hack } = data;

  // Get progression color and classes
  const progressionColor = getProgressionColor(hack.completion_count, hack.is_locked);
  const progressionClasses = getProgressionClasses(progressionColor);
  const completionCountText = formatCompletionCount(hack.completion_count || 0);

  // Determine border color
  const borderColor = progressionColor === 'green' ? '#10b981' :
                     progressionColor === 'blue' ? '#3b82f6' :
                     progressionColor === 'purple' ? '#a855f7' :
                     progressionColor === 'orange' ? '#f97316' :
                     hack.is_locked ? '#4b5563' : '#6b7280';

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div
        className={cn(
          "bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all",
          selected && "ring-2 ring-yellow-400",
          hack.is_locked && "opacity-60"
        )}
        style={{
          width: '200px',
          border: `4px solid ${borderColor}`,
          clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)'
        }}
      >
        {/* Image */}
        <div className="relative h-24 bg-gray-700">
          {hack.image_url ? (
            <Image
              src={hack.image_url}
              alt={hack.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No Image
            </div>
          )}

          {/* Lock overlay */}
          {hack.is_locked && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
          )}

          {/* Completion counter */}
          {hack.completion_count && hack.completion_count > 0 && (
            <div className={cn(
              "absolute top-1 right-1 px-2 py-0.5 rounded text-xs font-bold",
              progressionClasses.bgClass,
              progressionClasses.textClass
            )}>
              {completionCountText}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">
            {hack.name}
          </h3>

          <p className="text-gray-400 text-xs line-clamp-2 mb-2">
            {hack.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {hack.duration_minutes && (
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Clock className="h-3 w-3" />
                <span>{hack.duration_minutes}m</span>
              </div>
            )}

            {/* Progress dots */}
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    hack.completion_count && hack.completion_count >= i
                      ? "bg-green-500"
                      : "bg-gray-600"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          {hack.tags && hack.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hack.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  );
});

HackNode.displayName = 'HackNode';