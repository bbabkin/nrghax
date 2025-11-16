import { requireAdmin } from '@/lib/auth/user';
import Link from 'next/link';
import { Database, Calendar, Tag, Users, Layers, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Admin Dashboard - NRGHax',
  description: 'Manage your NRGHax content',
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const adminSections = [
    {
      title: 'Hacks',
      description: 'Create and manage hacks',
      href: '/admin/hacks/new',
      icon: Database,
      color: 'from-green-500/20 to-green-900/20',
      borderColor: 'border-green-500/30',
    },
    {
      title: 'Routines',
      description: 'Create and manage routines',
      href: '/admin/routines',
      icon: Calendar,
      color: 'from-yellow-500/20 to-yellow-900/20',
      borderColor: 'border-yellow-500/30',
    },
    {
      title: 'Tags',
      description: 'Manage tags and assignments',
      href: '/admin/tags',
      icon: Tag,
      color: 'from-blue-500/20 to-blue-900/20',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'Levels',
      description: 'Manage skill levels',
      href: '/admin/levels',
      icon: Layers,
      color: 'from-purple-500/20 to-purple-900/20',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Users',
      description: 'Manage user accounts',
      href: '/admin/users',
      icon: Users,
      color: 'from-orange-500/20 to-orange-900/20',
      borderColor: 'border-orange-500/30',
    },
    {
      title: 'Onboarding',
      description: 'Manage onboarding flow',
      href: '/admin/onboarding',
      icon: BookOpen,
      color: 'from-pink-500/20 to-pink-900/20',
      borderColor: 'border-pink-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-block text-yellow-400 hover:text-yellow-300 mb-6 transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 uppercase tracking-wider mb-2">
            Admin Dashboard
          </h1>
          <div className="w-32 h-1 bg-yellow-400" />
          <p className="text-gray-400 mt-4">
            Manage all aspects of your NRGHax platform
          </p>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className={`group relative bg-gray-900 border-2 ${section.borderColor} p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden`}
                style={{
                  clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
                }}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-50 group-hover:opacity-70 transition-opacity`}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-12 w-12 text-yellow-400" />
                    <div className="text-yellow-400 text-sm font-bold">→</div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {section.title}
                  </h2>
                  <p className="text-gray-400 text-sm">{section.description}</p>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 to-transparent" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats (Optional - can be expanded later) */}
        <div className="mt-12 p-6 bg-gray-900 border-2 border-yellow-400/30"
          style={{
            clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
          }}
        >
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/hacks/new"
              className="text-center p-4 bg-gray-800 hover:bg-gray-700 transition-colors rounded"
            >
              <Database className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <div className="text-sm text-white">New Hack</div>
            </Link>
            <Link
              href="/admin/routines"
              className="text-center p-4 bg-gray-800 hover:bg-gray-700 transition-colors rounded"
            >
              <Calendar className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-sm text-white">New Routine</div>
            </Link>
            <Link
              href="/admin/tags"
              className="text-center p-4 bg-gray-800 hover:bg-gray-700 transition-colors rounded"
            >
              <Tag className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <div className="text-sm text-white">New Tag</div>
            </Link>
            <Link
              href="/admin/users"
              className="text-center p-4 bg-gray-800 hover:bg-gray-700 transition-colors rounded"
            >
              <Users className="h-6 w-6 text-orange-400 mx-auto mb-2" />
              <div className="text-sm text-white">View Users</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
