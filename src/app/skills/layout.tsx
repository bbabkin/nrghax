import { getCurrentUser } from '@/lib/auth/user'
import { ProgressMigrator } from '@/components/levels/ProgressMigrator'

export default async function SkillsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <>
      {user && <ProgressMigrator userId={user.id} />}
      {children}
    </>
  )
}