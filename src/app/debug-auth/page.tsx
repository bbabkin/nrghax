import { getCurrentUser } from '@/lib/auth/user';
import { createClient } from '@/lib/supabase/server';

export default async function DebugAuthPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let profileData = null;
  if (authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    profileData = profile;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">getCurrentUser() Result:</h2>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Supabase Auth User:</h2>
          <pre className="text-sm overflow-x-auto">
            {authUser ? JSON.stringify({
              id: authUser.id,
              email: authUser.email,
              created_at: authUser.created_at
            }, null, 2) : 'null'}
          </pre>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Profile Data:</h2>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Summary:</h2>
          {user ? (
            <div>
              <p>✅ Logged in as: <strong>{user.email}</strong></p>
              <p>Admin status: <strong className={user.is_admin ? 'text-green-600' : 'text-red-600'}>
                {user.is_admin ? '✅ YES' : '❌ NO'}
              </strong></p>
              <p>User ID: <code className="text-xs">{user.id}</code></p>
            </div>
          ) : (
            <p>❌ Not logged in</p>
          )}
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Visit this page: <code>http://localhost:3000/debug-auth</code></li>
            <li>If not logged in, go to <code>/auth</code> and sign in</li>
            <li>Admin accounts available:
              <ul className="ml-6 mt-1">
                <li><code>admin@test.com</code> / <code>Admin123!</code></li>
                <li><code>bbabkin@gmail.com</code> / <code>Password123!</code></li>
              </ul>
            </li>
            <li>After login, return here to verify admin status</li>
            <li>Then visit <code>/hacks</code> to check admin controls</li>
          </ol>
        </div>
      </div>
    </div>
  );
}