import { getCurrentUser } from '@/lib/auth/supabase-user'
import { Navbar } from './navbar'

export async function NavbarWrapper() {
  const user = await getCurrentUser()

  return <Navbar user={user} />
}