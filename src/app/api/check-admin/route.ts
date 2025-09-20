import { getCurrentUser } from '@/lib/auth/user';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({
      error: 'Not authenticated',
      details: 'Please log in first'
    }, { status: 401 });
  }

  // Get all admins count
  const adminCount = await prisma.user.count({
    where: { isAdmin: true }
  });

  // Get total users count
  const totalUsers = await prisma.user.count();

  return NextResponse.json({
    currentUser: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    },
    stats: {
      totalAdmins: adminCount,
      totalUsers: totalUsers,
      isFirstUser: totalUsers === 1
    },
    schema: {
      profileExists: true
    },
    recommendations: !user.isAdmin ? [
      'User is NOT admin. To fix:',
      '1. Update user in database',
      `2. Set isAdmin to true for user ID: ${user.id}`,
    ] : ['User is already an admin ✅']
  });
}