/**
 * AYOSPH - SUPABASE SQL SCHEMA
 * 
 * This file contains all the SQL needed to set up AyosPH in Supabase.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Supabase project
 * 2. Go to SQL Editor
 * 3. Create a new query
 * 4. Copy and paste the entire contents of this file
 * 5. Run the query
 * 
 * The schema will be created with proper RLS policies and security.
 */

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    barangay TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('resident', 'admin')),
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Roads', 'Garbage', 'Drainage', 'Flooding', 'Street Lights', 
        'Public Safety', 'Infrastructure', 'Others'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Emergency')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN (
        'Pending', 'Under Review', 'In Progress', 'Fixed', 'Rejected'
    )),
    location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_before TEXT,
    image_after TEXT,
    remarks TEXT,
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fixed_at TIMESTAMP WITH TIME ZONE,
    priority BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    CONSTRAINT description_length CHECK (char_length(description) >= 10)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT message_length CHECK (char_length(message) >= 1)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('status_update', 'comment', 'assignment', 'system')),
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity log table
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_reports_reported_by ON public.reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON public.reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_to ON public.reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_reports_barangay ON public.reports(location);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_report_id ON public.comments(report_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_report_id ON public.activity_log(report_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Admins can read all user profiles
CREATE POLICY "Admins can read all profiles" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Service role can insert users
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- REPORTS TABLE POLICIES
-- =====================================================

-- Anyone can read reports
CREATE POLICY "Anyone can read reports" ON public.reports
    FOR SELECT USING (true);

-- Residents can create reports
CREATE POLICY "Residents can create reports" ON public.reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'resident'
        )
    );

-- Users can update their own reports (if not yet processed)
CREATE POLICY "Users can update own reports" ON public.reports
    FOR UPDATE USING (
        reported_by = auth.uid() AND status = 'Pending'
    );

-- Admins can update any report
CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Residents can delete their own pending reports
CREATE POLICY "Residents can delete own pending reports" ON public.reports
    FOR DELETE USING (
        reported_by = auth.uid() AND status = 'Pending'
    );

-- =====================================================
-- COMMENTS TABLE POLICIES
-- =====================================================

-- Anyone can read comments
CREATE POLICY "Anyone can read comments" ON public.comments
    FOR SELECT USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can comment" ON public.comments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
    );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (user_id = auth.uid());

-- Admins or comment authors can delete comments
CREATE POLICY "Admins and authors can delete comments" ON public.comments
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- ACTIVITY LOG POLICIES
-- =====================================================

-- Admins can read activity logs
CREATE POLICY "Admins can read activity logs" ON public.activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert activity logs
CREATE POLICY "System can create activity logs" ON public.activity_log
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Allow anyone to view report images
CREATE POLICY "Public access report images" ON storage.objects
    FOR SELECT USING (bucket_id = 'reports');

-- Allow authenticated users to upload report images
CREATE POLICY "Users can upload report images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'reports' AND 
        auth.role() = 'authenticated'
    );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        (bucket_id = 'reports' AND owner = auth.uid()) OR
        (bucket_id = 'avatars' AND owner = auth.uid())
    );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment report views
CREATE OR REPLACE FUNCTION increment_report_views(report_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.reports SET views_count = views_count + 1
    WHERE id = report_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id UUID,
    report_id UUID,
    title TEXT,
    message TEXT,
    noti_type TEXT,
    link TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (user_id, report_id, title, message, type, link)
    VALUES (target_user_id, report_id, title, message, noti_type, link);
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    actor_id UUID,
    report_id UUID,
    action TEXT,
    details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.activity_log (user_id, report_id, action, details)
    VALUES (actor_id, report_id, action, details);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Insert sample admin user (DO NOT USE IN PRODUCTION)
-- Use Supabase Auth UI to create users properly
-- This is just for schema demonstration

-- =====================================================
-- VIEWS
-- =====================================================

-- Reports with user details
CREATE OR REPLACE VIEW public.reports_with_user AS
SELECT 
    r.*,
    u.full_name as reported_by_name,
    u.email as reported_by_email,
    u.barangay as reported_by_barangay,
    au.full_name as assigned_to_name
FROM public.reports r
LEFT JOIN public.users u ON r.reported_by = u.id
LEFT JOIN public.users au ON r.assigned_to = au.id;

-- Reports statistics
CREATE OR REPLACE VIEW public.reports_stats AS
SELECT 
    COUNT(*) as total_reports,
    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_reports,
    COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_reports,
    COUNT(CASE WHEN status = 'Fixed' THEN 1 END) as fixed_reports,
    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_reports,
    COUNT(CASE WHEN severity = 'Emergency' THEN 1 END) as emergency_reports
FROM public.reports;

-- Category statistics
CREATE OR REPLACE VIEW public.category_stats AS
SELECT 
    category,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'Fixed' THEN 1 END) as fixed_count
FROM public.reports
GROUP BY category;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant public access to necessary views
GRANT SELECT ON public.reports_with_user TO anon, authenticated;
GRANT SELECT ON public.reports_stats TO anon, authenticated;
GRANT SELECT ON public.category_stats TO anon, authenticated;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- NOTE: After running this schema:
-- 1. Configure Supabase Email Authentication
-- 2. Set up Email templates in Auth > Email Templates
-- 3. Configure JWT settings
-- 4. Set up OAuth providers if needed
-- 5. Update environment variables in your app
