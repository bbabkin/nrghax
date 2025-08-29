// Server component to display server-side session data
import { auth } from '@/lib/auth';

export async function DebugSessionInfo() {
  const session = await auth();
  
  return (
    <div className="bg-yellow-100 border-2 border-yellow-500 p-4 rounded-lg">
      <h3 className="font-bold text-lg mb-2 text-yellow-900">🔍 Server-Side Session (auth())</h3>
      <pre className="bg-white p-2 rounded overflow-auto max-h-96 text-xs">
        {JSON.stringify(session, null, 2)}
      </pre>
      <div className="mt-2 text-sm text-yellow-800">
        <p>Session Status: <span className="font-bold">{session ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}</span></p>
        {session?.user && (
          <>
            <p>User ID: <span className="font-mono">{session.user.id}</span></p>
            <p>Email: <span className="font-mono">{session.user.email}</span></p>
            <p>Role: <span className="font-mono">{session.user.role || 'undefined'}</span></p>
          </>
        )}
      </div>
    </div>
  );
}