import { AuthForm } from '@/components/auth/auth-form';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function AuthPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to NRGHax</h1>
        <p className="text-gray-600">Sign in to track your learning progress</p>
      </div>
      <AuthForm />
    </div>
  );
}