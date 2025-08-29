-- Fix audit_logs table schema to match the audit system implementation
-- This migration adds missing columns and renames existing ones for consistency
-- Migration is idempotent and safe to run multiple times

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add details column (rename from changes for consistency with code)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'details'
    ) THEN
        -- First add the details column
        ALTER TABLE public.audit_logs ADD COLUMN details JSONB;
        
        -- Copy existing data from changes to details if changes column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'audit_logs' 
            AND column_name = 'changes'
        ) THEN
            UPDATE public.audit_logs SET details = changes WHERE changes IS NOT NULL;
        END IF;
    END IF;

    -- Add severity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'severity'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN severity VARCHAR(20) DEFAULT 'info';
    END IF;

    -- Add user_agent column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_agent TEXT;
    END IF;

    -- Add user_id column if it doesn't exist (alias for admin_id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_id UUID;
        
        -- Copy existing admin_id values to user_id
        UPDATE public.audit_logs SET user_id = admin_id WHERE admin_id IS NOT NULL;
        
        -- Make user_id NOT NULL after copying data
        ALTER TABLE public.audit_logs ALTER COLUMN user_id SET NOT NULL;
        
        -- Add foreign key constraint for user_id
        ALTER TABLE public.audit_logs 
        ADD CONSTRAINT audit_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    -- Add user_email column if it doesn't exist (alias for admin_email)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'user_email'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN user_email TEXT;
        
        -- Copy existing admin_email values to user_email
        UPDATE public.audit_logs SET user_email = admin_email WHERE admin_email IS NOT NULL;
        
        -- Make user_email NOT NULL after copying data
        ALTER TABLE public.audit_logs ALTER COLUMN user_email SET NOT NULL;
    END IF;
END $$;

-- Update check constraint to include new severity values
DO $$
BEGIN
    -- Drop existing severity constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_severity_check' 
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_severity_check;
    END IF;
    
    -- Add severity constraint
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_severity_check 
        CHECK (severity IN ('info', 'warning', 'error', 'critical'));
END $$;

-- Update action constraint to include all action types from the enum
DO $$
BEGIN
    -- Drop existing action constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_action_check' 
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_action_check;
    END IF;
    
    -- Add updated action constraint with all possible values
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_action_check 
        CHECK (action IN (
            -- View actions
            'view_users', 'view_user', 'search_users',
            -- Edit actions  
            'create_user', 'edit_user_role', 'edit_user_status', 
            'deactivate_user', 'activate_user', 'bulk_edit_users',
            -- Delete actions
            'soft_delete_user', 'hard_delete_user', 'bulk_delete_users',
            -- Failed actions
            'create_user_failed', 'edit_user_failed', 'delete_user_failed',
            'unauthorized_access', 'database_error', 'concurrent_modification',
            -- System actions
            'admin_login', 'admin_logout', 'permission_grant', 'permission_revoke',
            -- Legacy actions (for backward compatibility)
            'view', 'edit', 'soft_delete', 'hard_delete', 'create', 'role_change'
        ));
END $$;

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);

-- Update RLS policies to work with both old and new column names
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

-- Recreate policies with updated logic
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Update comments for new columns
COMMENT ON COLUMN public.audit_logs.details IS 'JSON object containing action details and metadata';
COMMENT ON COLUMN public.audit_logs.severity IS 'Severity level: info, warning, error, critical';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'Browser user agent string of the admin performing the action';
COMMENT ON COLUMN public.audit_logs.user_id IS 'ID of the user who performed the action (same as admin_id)';
COMMENT ON COLUMN public.audit_logs.user_email IS 'Email of the user who performed the action (same as admin_email)';

-- Grant permissions for new columns
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;