import { getCurrentUser } from '@/lib/auth/user'
import { ProgressMigrator } from '@/components/levels/ProgressMigrator'

export default async function LevelsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {user && <ProgressMigrator userId={user.id} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
}