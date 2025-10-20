'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Layers } from 'lucide-react';
import { deleteLevel } from '@/lib/levels/adminActions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Level {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  position: number;
  hack_count?: number;
}

interface LevelListProps {
  levels: Level[];
}

export function LevelList({ levels }: LevelListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? All hacks in this level will be unassigned.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteLevel(id);
      router.refresh();
    } catch (error) {
      console.error('Error deleting level:', error);
      alert('Failed to delete level');
      setDeletingId(null);
    }
  };

  if (levels.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No levels yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first level to organize hacks
        </p>
        <Link href="/admin/levels/new">
          <Button>Create Level</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Icon</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Slug</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Hacks</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {levels.map((level) => (
            <tr key={level.id} className="hover:bg-muted/50">
              <td className="px-4 py-3 text-sm">{level.position}</td>
              <td className="px-4 py-3 text-sm">{level.icon || '-'}</td>
              <td className="px-4 py-3 text-sm font-medium">{level.name}</td>
              <td className="px-4 py-3 text-sm font-mono text-xs">{level.slug}</td>
              <td className="px-4 py-3 text-sm">
                <Link
                  href={`/admin/levels/${level.id}/hacks`}
                  className="text-primary hover:underline"
                >
                  {level.hack_count || 0} hacks
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                {level.description || '-'}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/levels/${level.id}/hacks`}>
                    <Button variant="outline" size="sm">
                      <Layers className="h-4 w-4 mr-1" />
                      Manage Hacks
                    </Button>
                  </Link>
                  <Link href={`/admin/levels/${level.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(level.id, level.name)}
                    disabled={deletingId === level.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
