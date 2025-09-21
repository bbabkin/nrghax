'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/lib/supabase/admin'
import { deleteUserAction } from '@/app/admin/users/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirmation-dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface UsersTableProps {
  users: UserProfile[]
}

export default function UsersTable({ users }: UsersTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deletingUsers, setDeletingUsers] = useState<Set<string>>(new Set())

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No users found</p>
      </div>
    )
  }

  const handleDeleteUser = async (userId: string) => {
    setDeletingUsers(prev => new Set(prev).add(userId))
    try {
      await deleteUserAction(userId)
      toast({
        title: 'Success',
        description: 'User has been deleted successfully',
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to delete user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setDeletingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {user.name || 'No name'}
                    </div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {user.email}
              </TableCell>
              <TableCell>
                {user.is_admin ? (
                  <Badge variant="default">Admin</Badge>
                ) : (
                  <Badge variant="secondary">User</Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(user.created_at)}
              </TableCell>
              <TableCell className="text-sm hidden lg:table-cell">
                {formatDate(user.updated_at)}
              </TableCell>
              <TableCell className="text-right">
                {!user.is_admin && (
                  <ConfirmDialog
                    title="Delete User"
                    description={`Are you sure you want to delete ${user.name || user.email}? This will permanently remove the user and all their data.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={() => handleDeleteUser(user.id)}
                    variant="destructive"
                  >
                    {({ onClick }) => (
                      <Button
                        onClick={onClick}
                        size="sm"
                        variant="ghost"
                        disabled={deletingUsers.has(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </ConfirmDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}