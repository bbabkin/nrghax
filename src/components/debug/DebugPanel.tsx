import { DebugSessionInfo } from './DebugSessionInfo';
import { DebugClientSession } from './DebugClientSession';
import { headers } from 'next/headers';

export async function DebugPanel() {
  // Get environment variables
  const envVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***HIDDEN***' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    DATABASE_URL: process.env.DATABASE_URL ? '***HIDDEN***' : 'NOT SET',
  };

  // Get request headers
  const headersList = await headers();
  const relevantHeaders: Record<string, string> = {};
  const importantHeaders = ['cookie', 'host', 'referer', 'user-agent', 'x-forwarded-for', 'x-forwarded-proto'];
  
  importantHeaders.forEach(header => {
    const value = headersList.get(header);
    if (value) {
      relevantHeaders[header] = header === 'cookie' ? value.substring(0, 200) + '...' : value;
    }
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-50 border-4 border-red-600 p-6 max-h-screen overflow-auto shadow-2xl">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-red-900 mb-4 bg-red-200 p-2 rounded">
          🚨 DEBUG PANEL - SESSION INVESTIGATION 🚨
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Server-side session */}
          <DebugSessionInfo />
          
          {/* Client-side session */}
          <DebugClientSession />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Environment Variables */}
          <div className="bg-green-100 border-2 border-green-500 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2 text-green-900">🔧 Environment Variables</h3>
            <pre className="bg-white p-2 rounded overflow-auto max-h-48 text-xs">
              {JSON.stringify(envVars, null, 2)}
            </pre>
          </div>

          {/* Request Headers */}
          <div className="bg-purple-100 border-2 border-purple-500 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2 text-purple-900">📋 Request Headers</h3>
            <pre className="bg-white p-2 rounded overflow-auto max-h-48 text-xs">
              {JSON.stringify(relevantHeaders, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-4 bg-gray-800 text-white p-4 rounded-lg">
          <p className="text-sm">
            <strong>Debug Time:</strong> {new Date().toISOString()} | 
            <strong className="ml-4">Path:</strong> /admin | 
            <strong className="ml-4">Build Mode:</strong> {process.env.NODE_ENV}
          </p>
        </div>
      </div>
    </div>
  );
}