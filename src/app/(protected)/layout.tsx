import { requireAuth } from '@/lib/auth/supabase-user'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAuth()
  } catch {
    redirect('/auth')
  }

  return <>{children}</>
}