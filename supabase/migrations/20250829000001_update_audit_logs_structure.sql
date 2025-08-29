-- Update audit_logs table structure to match test implementation
-- This migration updates the existing audit_logs table to align with the audit system

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role can manage audit_logs" ON public.audit_logs;

-- Drop existing constraints and indexes
DROP INDEX IF EXISTS idx_audit_logs_admin_id;
DROP INDEX IF EXISTS idx_audit_logs_target_user_id;
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_target_user_id_fkey;

-- Drop existing table to recreate with new structure
DROP TABLE IF EXISTS public.audit_logs;

-- Create updated audit_logs table with new structure
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID,
    details JSONB NOT NULL DEFAULT '{}',
    severity TEXT NOT NULL DEFAULT 'info',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_target_user_id ON public.audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity);

-- Add check constraints
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_severity_check 
    CHECK (severity IN ('info', 'warning', 'error', 'critical'));

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Service role can do everything (for system operations)
CREATE POLICY "Service role can manage audit_logs" ON public.audit_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.audit_logs TO anon;

-- Add helpful comments
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all admin actions';
COMMENT ON COLUMN public.audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN public.audit_logs.user_email IS 'Email of the user (for historical record)';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (using AuditAction enum)';
COMMENT ON COLUMN public.audit_logs.target_user_id IS 'ID of the user affected by the action (optional)';
COMMENT ON COLUMN public.audit_logs.details IS 'JSON object containing action details and metadata';
COMMENT ON COLUMN public.audit_logs.severity IS 'Severity level: info, warning, error, critical';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the user performing the action';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent string of the browser/client';