import { createClient } from '@/lib/supabase/server'
import { Navbar } from './navbar'

export async function NavbarWrapper() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }
  
  return <Navbar user={user} profile={profile} />
}