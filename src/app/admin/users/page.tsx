import { getAllUsers, isUserAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import UsersTable from '@/components/admin/users-table'

export default async function AdminUsersPage() {
  // Double-check admin status (middleware should have already checked)
  const isAdmin = await isUserAdmin()
  
  if (!isAdmin) {
    redirect('/')
  }

  const users = await getAllUsers()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all registered users
        </p>
      </div>

      {users ? (
        <UsersTable users={users} />
      ) : (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load users. Please try again later.
          </p>
        </div>
      )}
    </div>
  )
}