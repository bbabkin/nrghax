'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams?.get('reason');

  const getMessage = () => {
    switch (reason) {
      case 'admin_required':
        return {
          title: 'Admin Access Required',
          message: 'You need administrator privileges to access this page.',
          suggestion: 'Contact your system administrator if you believe you should have access.'
        };
      case 'insufficient_permissions':
        return {
          title: 'Insufficient Permissions',
          message: 'You don\'t have the required permissions to perform this action.',
          suggestion: 'Your current role doesn\'t allow access to this resource.'
        };
      default:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this page.',
          suggestion: 'Please contact your administrator if you think this is an error.'
        };
    }
  };

  const { title, message, suggestion } = getMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
          <ShieldX className="h-10 w-10 text-red-600" />
        </div>

        {/* Content */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-gray-600 mb-4" data-testid="access-error">
            {message}
          </p>
          <p className="text-sm text-gray-500">
            {suggestion}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            data-testid="back-to-dashboard"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center px-4 py-3 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>

        {/* Help */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-3">
            Need help? Contact our support team:
          </p>
          <a 
            href="mailto:support@example.com" 
            className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            support@example.com
          </a>
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <p>Error Code: 403 - Forbidden</p>
            <p>Timestamp: {new Date().toISOString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccessDenied() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
            <ShieldX className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Loading...</p>
        </div>
      </div>
    }>
      <AccessDeniedContent />
    </Suspense>
  );
}