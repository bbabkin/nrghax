import { getCurrentUser } from '@/lib/auth/user'
import { Navbar } from './navbar'

export async function NavbarWrapper() {
  const user = await getCurrentUser()

  return <Navbar user={user} />
}