'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect, useState } from 'react';

export function DebugClientSession() {
  const { user, session, loading, profile } = useAuth();
  const [cookies, setCookies] = useState<string>('');
  const [localStorage, setLocalStorage] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get cookies
    setCookies(document.cookie);
    
    // Get localStorage items
    const items: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        items[key] = window.localStorage.getItem(key) || '';
      }
    }
    setLocalStorage(items);
  }, []);

  return (
    <div className="bg-blue-100 border-2 border-blue-500 p-4 rounded-lg">
      <h3 className="font-bold text-lg mb-2 text-blue-900">🖥️ Client-Side Session (useSession)</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold text-blue-800">Auth Status: 
          <span className={`ml-2 px-2 py-1 rounded ${
            user ? 'bg-green-500 text-white' : 
            loading ? 'bg-yellow-500 text-white' : 
            'bg-red-500 text-white'
          }`}>
            {loading ? 'LOADING' : user ? 'AUTHENTICATED' : 'UNAUTHENTICATED'}
          </span>
        </h4>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-blue-800 mb-1">Auth Data:</h4>
        <pre className="bg-white p-2 rounded overflow-auto max-h-48 text-xs">
          {JSON.stringify({ user, profile, session }, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-blue-800 mb-1">🍪 Cookies:</h4>
        <pre className="bg-white p-2 rounded overflow-auto max-h-32 text-xs break-all">
          {cookies || 'No cookies found'}
        </pre>
      </div>

      <div>
        <h4 className="font-semibold text-blue-800 mb-1">💾 LocalStorage:</h4>
        <pre className="bg-white p-2 rounded overflow-auto max-h-32 text-xs">
          {JSON.stringify(localStorage, null, 2)}
        </pre>
      </div>
    </div>
  );
}