'use client';

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { HackCard } from '../cards/HackCard';
import { PERFORMANCE_CONFIG, VISUAL_CONFIG } from '@/config/canvas.config';
import type { Tables } from '@/types/supabase';

interface VirtualSkillsTreeProps {
  levels: Array<{
    id: string;
    name: string;
    slug: string;
    position: number;
    hacks: Array<Tables<'hacks'> & {
      prerequisites?: string[];
      is_completed?: boolean;
      completion_count?: number;
    }>;
  }>;
  userCompletions?: Record<string, any>;
  isAuthenticated?: boolean;
  onHackComplete?: (hackId: string) => void;
}

// Calculate item heights dynamically
const LEVEL_HEADER_HEIGHT = 120;
const HACK_CARD_HEIGHT = 320;
const LEVEL_CONNECTOR_HEIGHT = 80;
const HACK_SPACING = 32;

interface ItemData {
  type: 'level-header' | 'hack' | 'level-connector';
  level?: any;
  hack?: any;
  levelIndex?: number;
  hackIndex?: number;
  isLastLevel?: boolean;
  isLastHack?: boolean;
}

export const VirtualSkillsTree = React.memo(function VirtualSkillsTree({
  levels,
  userCompletions = {},
  isAuthenticated = false,
  onHackComplete
}: VirtualSkillsTreeProps) {
  const router = useRouter();
  const listRef = useRef<List>(null);
  const itemHeights = useRef<Record<number, number>>({});

  // Flatten the tree structure for virtualization
  const items = useMemo(() => {
    const flatItems: ItemData[] = [];

    levels.forEach((level, levelIndex) => {
      // Add level header
      flatItems.push({
        type: 'level-header',
        level,
        levelIndex,
        isLastLevel: levelIndex === levels.length - 1
      });

      // Add hacks for this level
      const sortedHacks = [...level.hacks].sort((a, b) =>
        (a.position || 0) - (b.position || 0)
      );

      sortedHacks.forEach((hack, hackIndex) => {
        flatItems.push({
          type: 'hack',
          hack,
          level,
          levelIndex,
          hackIndex,
          isLastHack: hackIndex === sortedHacks.length - 1
        });
      });

      // Add level connector (except for last level)
      if (levelIndex < levels.length - 1) {
        flatItems.push({
          type: 'level-connector',
          levelIndex
        });
      }
    });

    return flatItems;
  }, [levels]);

  // Calculate item height based on type
  const getItemSize = useCallback((index: number) => {
    const item = items[index];
    if (!item) return HACK_CARD_HEIGHT;

    switch (item.type) {
      case 'level-header':
        return LEVEL_HEADER_HEIGHT;
      case 'hack':
        return HACK_CARD_HEIGHT + (item.isLastHack ? 0 : HACK_SPACING);
      case 'level-connector':
        return LEVEL_CONNECTOR_HEIGHT;
      default:
        return HACK_CARD_HEIGHT;
    }
  }, [items]);

  // Check if hack is unlocked based on prerequisites
  const isHackUnlocked = useCallback((hack: any, level: any) => {
    if (!hack.prerequisites || hack.prerequisites.length === 0) {
      return true;
    }

    // Check if all prerequisites are completed
    return hack.prerequisites.every((prereqId: string) => {
      const completion = userCompletions[`hack-${prereqId}`];
      return completion?.completed;
    });
  }, [userCompletions]);

  // Handle hack click
  const handleHackClick = useCallback((hack: any, level: any) => {
    if (!isHackUnlocked(hack, level)) return;

    // Store scroll position before navigating
    if (typeof window !== 'undefined' && listRef.current) {
      const scrollOffset = listRef.current.state.scrollOffset;
      sessionStorage.setItem('skillsVirtualScrollPosition', scrollOffset.toString());
      sessionStorage.setItem('returnToPage', 'skills');
    }

    router.push(`/skills/${level.slug}/hacks/${hack.slug}?from=skills`);
  }, [router, isHackUnlocked]);

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('skillsVirtualScrollPosition');
    if (savedPosition && listRef.current) {
      const position = parseInt(savedPosition, 10);
      listRef.current.scrollTo(position);
      sessionStorage.removeItem('skillsVirtualScrollPosition');
    }
  }, []);

  // Row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];

    if (!item) return null;

    switch (item.type) {
      case 'level-header':
        return (
          <div style={style} className="flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-yellow-400 uppercase tracking-wider mb-2">
                {item.level.name}
              </h2>
              <div className="w-32 h-1 bg-yellow-400 mx-auto" />
            </motion.div>
          </div>
        );

      case 'hack':
        const hack = item.hack;
        const level = item.level;
        const isUnlocked = isHackUnlocked(hack, level);
        const completion = userCompletions[`hack-${hack.id}`];

        return (
          <div style={style} className="flex flex-col items-center px-4">
            {/* Connection line from previous hack */}
            {item.hackIndex > 0 && (
              <div className="w-0.5 h-8 bg-zinc-700 mb-4" />
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className="w-full max-w-md"
            >
              <HackCard
                hack={hack}
                isCompleted={completion?.completed || false}
                isUnlocked={isUnlocked}
                completedCount={completion?.completion_count || 0}
                isCurrentLevel={item.levelIndex === 0}
                onComplete={() => onHackComplete?.(hack.id)}
              />
            </motion.div>
          </div>
        );

      case 'level-connector':
        return (
          <div style={style} className="flex items-center justify-center">
            <div className="w-1 h-full bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 opacity-50" />
          </div>
        );

      default:
        return null;
    }
  }, [items, userCompletions, isHackUnlocked, handleHackClick, onHackComplete]);

  // Check if all items are loaded (for infinite loading)
  const isItemLoaded = useCallback((index: number) => {
    return !!items[index];
  }, [items]);

  // Load more items (placeholder for future dynamic loading)
  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number) => {
    // In the future, this could load levels/hacks dynamically
    // For now, all items are pre-loaded
    return Promise.resolve();
  }, []);

  return (
    <div className="w-full h-full bg-black">
      <AutoSizer>
        {({ height, width }) => (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={items.length}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={(list) => {
                  ref(list);
                  listRef.current = list;
                }}
                height={height}
                width={width}
                itemCount={items.length}
                itemSize={getItemSize}
                onItemsRendered={onItemsRendered}
                overscanCount={PERFORMANCE_CONFIG.VIRTUAL_SCROLL.OVERSCAN}
                className="scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-zinc-900"
              >
                {Row}
              </List>
            )}
          </InfiniteLoader>
        )}
      </AutoSizer>
    </div>
  );
});

// Export a loading skeleton for suspense fallback
export function VirtualSkillsTreeSkeleton() {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Loading skills tree...</p>
      </div>
    </div>
  );
}