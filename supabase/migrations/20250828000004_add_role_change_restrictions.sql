-- Add role change restrictions and audit triggers
-- This migration handles role change security at the database level

-- Create a function to validate role changes
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Get current user's role
    DECLARE
        current_user_role TEXT;
    BEGIN
        SELECT role INTO current_user_role 
        FROM users 
        WHERE id = auth.uid();
        
        -- If no role change, allow
        IF OLD.role = NEW.role THEN
            RETURN NEW;
        END IF;
        
        -- Service role can change any role
        IF current_setting('role') = 'service_role' THEN
            RETURN NEW;
        END IF;
        
        -- Super admins can change anyone's role to anything
        IF current_user_role = 'super_admin' THEN
            RETURN NEW;
        END IF;
        
        -- Regular admins have restrictions
        IF current_user_role = 'admin' THEN
            -- Admins cannot change their own role
            IF auth.uid() = NEW.id THEN
                RAISE EXCEPTION 'Admins cannot change their own role';
            END IF;
            
            -- Admins cannot promote anyone to super_admin
            IF NEW.role = 'super_admin' THEN
                RAISE EXCEPTION 'Admins cannot promote users to super_admin';
            END IF;
            
            -- Admins cannot demote super_admins
            IF OLD.role = 'super_admin' THEN
                RAISE EXCEPTION 'Admins cannot modify super_admin accounts';
            END IF;
            
            RETURN NEW;
        END IF;
        
        -- Regular users cannot change roles
        RAISE EXCEPTION 'Insufficient permissions to change user roles';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change validation
DROP TRIGGER IF EXISTS validate_user_role_change ON users;
CREATE TRIGGER validate_user_role_change
    BEFORE UPDATE OF role ON users
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_role_change();

-- Create a function to automatically log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if role actually changed
    IF OLD.role != NEW.role THEN
        INSERT INTO public.audit_logs (
            admin_id,
            admin_email,
            action,
            target_user_id,
            target_user_email,
            changes,
            ip_address
        ) VALUES (
            COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
            COALESCE(
                (SELECT email FROM users WHERE id = auth.uid()),
                'system@admin'
            ),
            'role_change',
            NEW.id,
            NEW.email,
            jsonb_build_object(
                'old_role', OLD.role,
                'new_role', NEW.role,
                'changed_at', NOW()
            ),
            inet_client_addr()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS log_user_role_change ON users;
CREATE TRIGGER log_user_role_change
    AFTER UPDATE OF role ON users
    FOR EACH ROW
    EXECUTE FUNCTION public.log_role_change();

-- Add comments
COMMENT ON FUNCTION public.validate_role_change() IS 'Validates role changes according to admin hierarchy rules';
COMMENT ON FUNCTION public.log_role_change() IS 'Automatically logs all role changes to audit_logs table';