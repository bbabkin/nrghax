'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AdminCheckData {
  currentUser: {
    id: string;
    email: string;
    profileEmail: string;
    fullName: string;
    isAdmin: boolean;
    createdAt: string;
  };
  stats: {
    totalAdmins: number;
    totalUsers: number;
    isFirstUser: boolean;
  };
  schema: {
    hasIsAdminColumn: boolean;
    profileExists: boolean;
  };
  recommendations: string[];
}

export default function AdminCheckPage() {
  const [data, setData] = useState<AdminCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/check-admin')
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          setError(result.error + ': ' + result.details);
        } else {
          setData(result);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-3">Checking admin status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <XCircle className="mr-2" />
              Error Checking Admin Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <p className="mt-4 text-sm text-gray-600">
              Please make sure you are logged in to check your admin status.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const isAdmin = data.currentUser.isAdmin;

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Admin Status Check</h1>

      {/* Current User Status */}
      <Card className={isAdmin ? 'border-green-200' : 'border-yellow-200'}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Account Status</span>
            {isAdmin ? (
              <Badge className="bg-green-500">
                <CheckCircle className="mr-1 h-4 w-4" />
                ADMIN
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="mr-1 h-4 w-4" />
                NOT ADMIN
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Email:</strong> {data.currentUser.email}</div>
          <div><strong>Profile Email:</strong> {data.currentUser.profileEmail}</div>
          <div><strong>Name:</strong> {data.currentUser.fullName || 'Not set'}</div>
          <div><strong>User ID:</strong> <code className="text-xs bg-gray-100 p-1 rounded">{data.currentUser.id}</code></div>
          <div><strong>Created:</strong> {new Date(data.currentUser.createdAt).toLocaleString()}</div>
        </CardContent>
      </Card>

      {/* Database Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Database Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Total Users:</strong> {data.stats.totalUsers}</div>
          <div><strong>Total Admins:</strong> {data.stats.totalAdmins}</div>
          <div><strong>First User:</strong> {data.stats.isFirstUser ? 'Yes (should be auto-admin)' : 'No'}</div>
        </CardContent>
      </Card>

      {/* Schema Check */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Schema Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center">
              {data.schema.profileExists ? (
                <CheckCircle className="text-green-500 mr-2" />
              ) : (
                <XCircle className="text-red-500 mr-2" />
              )}
              <span>Profile exists in database</span>
            </div>
            <div className="flex items-center">
              {data.schema.hasIsAdminColumn ? (
                <CheckCircle className="text-green-500 mr-2" />
              ) : (
                <XCircle className="text-red-500 mr-2" />
              )}
              <span>is_admin column exists</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Card className="mt-6" >
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 text-yellow-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1">
              {data.recommendations.map((rec, index) => (
                <li key={index} className="text-sm">{rec}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Admin Access */}
      {isAdmin && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">Admin Access Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">You have admin access! You can now access:</p>
            <div className="grid grid-cols-2 gap-2">
              <a href="/admin/users" className="text-blue-500 hover:underline">→ User Management</a>
              <a href="/admin/hacks" className="text-blue-500 hover:underline">→ Hack Management</a>
              <a href="/admin/tags" className="text-blue-500 hover:underline">→ Tag Management</a>
              <a href="/admin/onboarding" className="text-blue-500 hover:underline">→ Onboarding Settings</a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}