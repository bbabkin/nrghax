# Product Requirements Document: Admin User Management

## Introduction/Overview

This feature introduces role-based access control (RBAC) to the application, enabling designated admin users to manage other users through a dedicated admin interface. Admin users will have access to a comprehensive user management page where they can view, edit, and delete user accounts, providing essential tools for user support, moderation, compliance, and general administration. The system will maintain an audit trail of all administrative actions for accountability and compliance purposes.

## Goals

1. Enable administrative control over user accounts for support and moderation purposes
2. Provide a secure, intuitive interface for admins to manage users efficiently
3. Implement role-based access control that can be extended to additional roles in the future
4. Maintain accountability through comprehensive audit logging
5. Ensure data integrity and security in all administrative operations

## User Stories

1. **As an admin**, I want to view a list of all users in the system so that I can monitor user activity and account status
2. **As an admin**, I want to search and filter users by various criteria so that I can quickly find specific users
3. **As an admin**, I want to edit user roles and account status so that I can grant permissions and manage account access
4. **As an admin**, I want to deactivate user accounts so that I can temporarily suspend access without losing user data
5. **As an admin**, I want to permanently delete user accounts so that I can comply with data removal requests
6. **As an admin**, I want to view detailed user information so that I can provide better support
7. **As an admin**, I want all my actions to be logged so that there's accountability in the system
8. **As a regular user**, I should not see or access admin features so that system security is maintained
9. **As the first admin**, I want to assign admin roles to other users so that I can delegate administrative tasks

## Functional Requirements

### Core Requirements

1. **Role System**
   - The system must support at least two roles: 'admin' and 'user' (default)
   - The system must store user roles in a way that allows easy addition of new roles
   - User role must be checked on both frontend and backend for security

2. **Admin Access Control**
   - Admin users must see a "Users" link in the navigation bar
   - Only authenticated admin users can access the users management page (/admin/users)
   - Non-admin users attempting to access admin pages must be redirected with appropriate error message

3. **Users Management Page**
   - The page must display users in a table format with the following columns:
     - User ID
     - Name
     - Email
     - Role
     - Account Status (active/deactivated)
     - Registration Date
     - Last Login
     - Actions (Edit/View/Delete buttons)

4. **Search and Filter Capabilities**
   - The system must provide a search bar to search users by name or email
   - The system must provide filters for:
     - Role (Admin/User)
     - Account Status (Active/Deactivated)
     - Registration Date Range
   - Filters must work in combination with each other

5. **Pagination**
   - The table must display a maximum of 20 users per page
   - The system must provide pagination controls (Previous, Next, Page numbers)
   - The system must show total number of users and current page information

6. **Sorting**
   - The table must allow sorting by:
     - Name (A-Z, Z-A)
     - Email (A-Z, Z-A)
     - Registration Date (Newest first, Oldest first)
     - Last Login (Most recent, Least recent)

7. **User Details View**
   - Clicking "View" must show detailed user information including:
     - Full profile information
     - Account creation timestamp
     - Last login timestamp
     - Login method (Email/OAuth provider)
     - Email verification status
     - Total number of logins
     - Account history/activity log

8. **Edit User Functionality**
   - Admins must be able to edit:
     - User role (change between admin and user)
     - Account status (activate/deactivate)
   - Admins must NOT be able to edit other admin accounts
   - Changes must be saved with confirmation message
   - Failed updates must show appropriate error messages

9. **Delete User Functionality**
   - The system must provide two deletion options:
     - Soft Delete (Deactivate): Marks account as inactive, preserves data
     - Hard Delete: Permanently removes user and all associated data
   - Delete action must show confirmation dialog with clear warning
   - The system must cascade delete all related user data on hard delete
   - Admins must NOT be able to delete their own account
   - The system must show appropriate error if self-deletion is attempted

10. **Audit Trail**
    - The system must log all admin actions with:
      - Admin user ID and email
      - Action performed (view/edit/delete)
      - Target user ID and email
      - Timestamp
      - Changes made (for edit actions)
      - IP address (optional)
    - Audit logs must be stored in a dedicated database table
    - Audit logs must be immutable (no edit/delete)

11. **Initial Admin Setup**
    - The first admin must be assigned manually through Supabase console
    - The system must recognize and properly authenticate the first admin

## Non-Goals (Out of Scope)

1. Multiple admin permission levels (super admin, moderator, etc.) - designed for future extension but not implemented
2. Bulk user operations (selecting and modifying multiple users at once)
3. Minimum admin count validation (allowing all admins to be removed)
4. User impersonation feature
5. Email notifications for admin actions
6. Audit log viewing interface (logs stored but not displayed in UI)
7. User analytics or reporting dashboards
8. API access for admin functions
9. Admin action reversal/undo functionality

## Design Considerations

### UI Components
- Use existing table components from shadcn/ui
- Maintain consistent styling with current dashboard
- Table should be responsive for mobile viewing
- Use existing button and modal components for actions
- Status badges should use consistent color coding:
  - Green for active users
  - Yellow for deactivated users
  - Blue for admin role
  - Gray for regular user role

### Navigation
- "Users" menu item should appear in navbar only for admin users
- Use existing navigation component with conditional rendering
- Add admin badge or indicator next to user name in navigation

### Error Handling
- All admin pages should use existing error boundary
- Show user-friendly error messages for unauthorized access
- Provide clear feedback for all actions (success/failure)

## Technical Considerations

### Database Schema
```sql
-- Add role column to existing users table
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  admin_email TEXT NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'view', 'edit', 'soft_delete', 'hard_delete'
  target_user_id UUID,
  target_user_email TEXT,
  changes JSONB, -- Store what was changed
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_target_user_id ON audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Add role index for filtering
CREATE INDEX idx_users_role ON users(role);
```

### Security
- All admin endpoints must verify user role in middleware
- Use Row Level Security (RLS) in Supabase for additional protection
- Implement rate limiting on admin actions
- Sanitize all user inputs to prevent XSS/SQL injection

### Performance
- Implement database indexing for searchable fields
- Use server-side pagination to handle large user bases
- Cache user count for pagination
- Implement debouncing on search input

### Integration Points
- Extend existing NextAuth session to include user role
- Integrate with existing Supabase client
- Use existing authentication middleware
- Extend current user type definitions

## Success Metrics

1. **Functionality Metrics**
   - 100% of admin actions are successfully logged in audit trail
   - Zero unauthorized access to admin functions
   - All CRUD operations complete within 2 seconds

2. **Usability Metrics**
   - Admins can find any user within 30 seconds using search/filter
   - 90% of admin tasks completed without errors
   - Reduced time to resolve user issues by 50%

3. **Security Metrics**
   - Zero security breaches through admin interface
   - 100% of admin actions are auditable
   - No data loss from accidental deletions (through soft delete option)

4. **Business Metrics**
   - 40% reduction in user support ticket resolution time
   - Improved compliance with data management requests
   - Increased admin efficiency in user management tasks

## Open Questions

1. Should we implement email notifications to users when their account is modified by an admin?
2. Do we need to implement session termination when a user is deactivated (force logout)?
3. Should there be a "restore" option for soft-deleted users within a certain timeframe?
4. Do we want to implement IP-based restrictions for admin access?
5. Should the audit log have a retention policy (e.g., keep logs for 1 year)?
6. Do we need to implement export functionality for audit logs (CSV/JSON)?
7. Should admins be notified when new users register?
8. Do we want to add user notes/comments feature for admins to document user issues?

## Implementation Priority

### Phase 1 (MVP)
1. Basic role system (admin/user)
2. Users list page with table view
3. Basic edit functionality (role, status)
4. Soft delete (deactivate)
5. Basic access control

### Phase 2
1. Search and filter capabilities
2. Pagination
3. Sorting
4. Hard delete option
5. Audit trail logging

### Phase 3
1. Detailed user view
2. Advanced filters
3. Performance optimizations
4. Enhanced security measures

---

*Document Version: 1.0*
*Created: January 2025*
*Status: Pending Review*