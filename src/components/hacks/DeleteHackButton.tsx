'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirmation-dialog';
import { deleteHack } from '@/lib/hacks/actions';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DeleteHackButtonProps {
  hackId: string;
  hackName?: string;
}

export function DeleteHackButton({ hackId, hackName = 'this hack' }: DeleteHackButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteHack(hackId);
      toast({
        title: 'Success',
        description: `Hack "${hackName}" has been deleted successfully`,
      });
      router.push('/admin/hacks');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete hack:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete hack. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      title="Delete Hack"
      description={`Are you sure you want to delete "${hackName}"? This will also remove all user progress and cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={handleDelete}
      variant="destructive"
    >
      {({ onClick }) => (
        <Button
          onClick={onClick}
          variant="destructive"
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? 'Deleting...' : 'Delete Hack'}
        </Button>
      )}
    </ConfirmDialog>
  );
}