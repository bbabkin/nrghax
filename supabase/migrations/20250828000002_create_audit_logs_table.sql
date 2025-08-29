-- Create audit_logs table for admin user management tracking
-- This migration is idempotent and safe to run multiple times

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    admin_email TEXT NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_user_id UUID,
    target_user_email TEXT,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add foreign key constraints (with checks for idempotency)
DO $$
BEGIN
    -- Add foreign key for admin_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_admin_id_fkey' 
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE public.audit_logs 
        ADD CONSTRAINT audit_logs_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;
    
    -- Add foreign key for target_user_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_target_user_id_fkey' 
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE public.audit_logs 
        ADD CONSTRAINT audit_logs_target_user_id_fkey 
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Add check constraint for valid actions
DO $$
BEGIN
    -- Drop constraint if it exists (for idempotency)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_action_check' 
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_action_check;
    END IF;
    
    -- Add the constraint
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_action_check 
        CHECK (action IN ('view', 'edit', 'soft_delete', 'hard_delete', 'create', 'role_change'));
END $$;

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs
-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Only admins can insert audit logs (system will use service role)
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Service role can do everything (for system operations)
CREATE POLICY "Service role can manage audit_logs" ON public.audit_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all admin actions on user management';
COMMENT ON COLUMN public.audit_logs.admin_id IS 'ID of the admin user who performed the action';
COMMENT ON COLUMN public.audit_logs.admin_email IS 'Email of the admin user (for historical record)';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (view, edit, soft_delete, hard_delete, create, role_change)';
COMMENT ON COLUMN public.audit_logs.target_user_id IS 'ID of the user affected by the action (nullable for bulk actions)';
COMMENT ON COLUMN public.audit_logs.target_user_email IS 'Email of the affected user (for historical record)';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSON object containing the changes made (before/after values)';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the admin performing the action';

-- Grant permissions
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;