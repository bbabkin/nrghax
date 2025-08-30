import { redirect } from 'next/navigation';
import { authServer } from '@/lib/supabase/auth';
import Link from 'next/link';
import { Users, Activity, Settings, BarChart3 } from 'lucide-react';
import { DebugPanel } from '@/components/debug/DebugPanel';

export default async function AdminDashboard() {
  // Server-side authentication check with Supabase
  const user = await authServer.getUser();
  
  if (!user) {
    console.log('No user found, redirecting to login');
    redirect('/login?callbackUrl=/admin');
  }

  // Get user profile to check role
  const userProfile = await authServer.getUserProfile(user.id);
  
  if (!userProfile) {
    console.log('No user profile found, redirecting to login');
    redirect('/login?callbackUrl=/admin');
  }

  // Check if user has admin role
  const userRole = userProfile.role;
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    console.log(`User role ${userRole} insufficient for admin access`);
    redirect('/access-denied?reason=admin_required');
  }

  const userName = userProfile.name || user.email;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DEBUG PANEL - Injected for session investigation */}
      <DebugPanel />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {userName}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {userRole}
              </span>
              <Link 
                href="/" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">Loading...</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">Loading...</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admin Actions</p>
                <p className="text-2xl font-bold text-gray-900">Loading...</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-green-600">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href="/admin/users" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <Users className="h-10 w-10 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600">View, edit, and manage user accounts</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/audit" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <Activity className="h-10 w-10 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
                <p className="text-sm text-gray-600">View system activity and admin actions</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/settings" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <Settings className="h-10 w-10 text-orange-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Configure system settings and preferences</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="px-6 py-4">
              <div className="text-center text-gray-500 py-8">
                <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No recent activity to display</p>
                <p className="text-sm mt-1">Admin actions will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}