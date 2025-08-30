// Server component to display server-side session data
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function DebugSessionInfo() {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }
  
  return (
    <div className="bg-yellow-100 border-2 border-yellow-500 p-4 rounded-lg">
      <h3 className="font-bold text-lg mb-2 text-yellow-900">🔍 Server-Side Session (Supabase)</h3>
      <pre className="bg-white p-2 rounded overflow-auto max-h-96 text-xs">
        {JSON.stringify({ user, profile, error }, null, 2)}
      </pre>
      <div className="mt-2 text-sm text-yellow-800">
        <p>Session Status: <span className="font-bold">{user ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}</span></p>
        {user && (
          <>
            <p>User ID: <span className="font-mono">{user.id}</span></p>
            <p>Email: <span className="font-mono">{user.email}</span></p>
            <p>Role: <span className="font-mono">{(profile as any)?.role || 'undefined'}</span></p>
          </>
        )}
      </div>
    </div>
  );
}