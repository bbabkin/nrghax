import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  // Dashboard is deprecated, redirect to library
  redirect('/library')
}
