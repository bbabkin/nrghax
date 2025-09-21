import { SupabaseAuthForm } from '@/components/auth/supabase-auth-form-new';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AuthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to NRGHax</h1>
        <p className="text-gray-600">Sign in to track your learning progress</p>
      </div>
      <SupabaseAuthForm />
    </div>
  );
}