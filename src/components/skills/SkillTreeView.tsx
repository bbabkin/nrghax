'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { HackNode } from './HackNode';
import { useRouter } from 'next/navigation';

const nodeTypes = {
  hackNode: HackNode,
};

interface SkillTreeViewProps {
  levelId: string;
  levelName: string;
  hacks: any[];
  prerequisites: any[];
  userProgress?: any;
}

export function SkillTreeView({
  levelId,
  levelName,
  hacks,
  prerequisites,
  userProgress = {}
}: SkillTreeViewProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build the tree structure
  useEffect(() => {
    if (!hacks || hacks.length === 0) return;

    // Create a map of hack prerequisites
    const prereqMap = new Map<string, string[]>();
    prerequisites.forEach(p => {
      if (!prereqMap.has(p.hack_id)) {
        prereqMap.set(p.hack_id, []);
      }
      if (p.prerequisite_hack_id) {
        prereqMap.get(p.hack_id)!.push(p.prerequisite_hack_id);
      }
    });

    // Find root hacks (no prerequisites)
    const rootHacks = hacks.filter(h => !prereqMap.has(h.id) || prereqMap.get(h.id)!.length === 0);

    // Build level map (distance from root)
    const levelMap = new Map<string, number>();
    const visited = new Set<string>();

    function calculateLevels(hackId: string, level: number) {
      if (visited.has(hackId)) return;
      visited.add(hackId);
      levelMap.set(hackId, Math.max(levelMap.get(hackId) || 0, level));

      // Find hacks that depend on this one
      prerequisites
        .filter(p => p.prerequisite_hack_id === hackId)
        .forEach(p => calculateLevels(p.hack_id, level + 1));
    }

    rootHacks.forEach(h => calculateLevels(h.id, 0));

    // Group hacks by level
    const levels = new Map<number, any[]>();
    hacks.forEach(hack => {
      const level = levelMap.get(hack.id) || 0;
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(hack);
    });

    // Calculate positions
    const nodeSpacingX = 250;
    const nodeSpacingY = 200;
    const newNodes: Node[] = [];

    levels.forEach((levelHacks, levelIndex) => {
      const totalWidth = (levelHacks.length - 1) * nodeSpacingX;
      const startX = -totalWidth / 2;

      levelHacks.forEach((hack, index) => {
        const isLocked = prereqMap.has(hack.id) &&
          prereqMap.get(hack.id)!.some(prereqId =>
            !userProgress[prereqId]?.completed
          );

        newNodes.push({
          id: hack.id,
          type: 'hackNode',
          position: {
            x: startX + index * nodeSpacingX,
            y: levelIndex * nodeSpacingY,
          },
          data: {
            hack: {
              ...hack,
              completion_count: userProgress[hack.id]?.completion_count || 0,
              is_locked: isLocked,
            }
          },
        });
      });
    });

    // Create edges
    const newEdges: Edge[] = prerequisites
      .filter(p => p.prerequisite_hack_id)
      .map(p => ({
        id: `${p.prerequisite_hack_id}-${p.hack_id}`,
        source: p.prerequisite_hack_id!,
        target: p.hack_id,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: '#4b5563',
          strokeWidth: 2,
        },
      }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [hacks, prerequisites, userProgress, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const hack = node.data.hack as any;
    if (!hack?.is_locked) {
      router.push(`/hacks/${hack.slug || hack.id}`);
    }
  }, [router]);

  return (
    <div className="h-screen bg-gray-900">
      <div className="absolute top-24 left-4 z-10">
        <h2 className="text-3xl font-bold text-yellow-400 uppercase">{levelName}</h2>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-900"
      >
        <Background color="#374151" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const hack = node.data?.hack as any;
            if (!hack) return '#6b7280';
            if (hack?.is_locked) return '#4b5563';
            if (hack?.completion_count > 50) return '#f97316';
            if (hack?.completion_count > 10) return '#a855f7';
            if (hack?.completion_count > 1) return '#3b82f6';
            if (hack?.completion_count === 1) return '#10b981';
            return '#6b7280';
          }}
          className="bg-gray-800"
        />
      </ReactFlow>
    </div>
  );
}