-- Create comprehensive analytics and reporting tables

-- System-wide analytics summary table
CREATE TABLE IF NOT EXISTS system_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    total_lecturers INTEGER DEFAULT 0,
    total_units INTEGER DEFAULT 0,
    total_enrollments INTEGER DEFAULT 0,
    total_assignments INTEGER DEFAULT 0,
    total_assessments INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    total_resources INTEGER DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- Daily activity tracking
CREATE TABLE IF NOT EXISTS daily_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    logins INTEGER DEFAULT 0,
    submissions INTEGER DEFAULT 0,
    assessments_taken INTEGER DEFAULT 0,
    resources_downloaded INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, activity_date)
);

-- Unit performance analytics
CREATE TABLE IF NOT EXISTS unit_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    analytics_date DATE NOT NULL,
    enrolled_students INTEGER DEFAULT 0,
    active_students INTEGER DEFAULT 0,
    assignment_completion_rate DECIMAL(5,2) DEFAULT 0,
    assessment_participation_rate DECIMAL(5,2) DEFAULT 0,
    resource_engagement_rate DECIMAL(5,2) DEFAULT 0,
    average_assignment_score DECIMAL(5,2),
    average_assessment_score DECIMAL(5,2),
    message_activity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unit_id, analytics_date)
);

-- Student performance tracking
CREATE TABLE IF NOT EXISTS student_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    performance_date DATE NOT NULL,
    assignments_submitted INTEGER DEFAULT 0,
    assignments_graded INTEGER DEFAULT 0,
    assignment_average DECIMAL(5,2),
    assessments_taken INTEGER DEFAULT 0,
    assessments_graded INTEGER DEFAULT 0,
    assessment_average DECIMAL(5,2),
    resources_accessed INTEGER DEFAULT 0,
    participation_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, unit_id, performance_date)
);

-- Report generation log
CREATE TABLE IF NOT EXISTS report_generation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    generated_by UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    report_parameters JSONB,
    file_name VARCHAR(255),
    file_size INTEGER,
    watermark_id VARCHAR(100),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    ip_address INET
);

-- Engagement metrics table
CREATE TABLE IF NOT EXISTS engagement_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    related_id UUID, -- Can reference any table
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_system_analytics_date ON system_analytics(date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_unit_analytics_unit_date ON unit_analytics(unit_id, analytics_date);
CREATE INDEX IF NOT EXISTS idx_student_performance_student_unit ON student_performance(student_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_report_log_generated_by ON report_generation_log(generated_by);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_user ON engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_type ON engagement_metrics(metric_type);

-- Enable RLS on analytics tables
ALTER TABLE system_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics tables
CREATE POLICY "Lecturers can view system analytics" ON system_analytics FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role IN ('lecturer', 'admin'))
);

CREATE POLICY "Users can view own activity" ON daily_activity FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can insert own activity" ON daily_activity FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Lecturers can view unit analytics" ON unit_analytics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM units 
        WHERE units.id = unit_analytics.unit_id 
        AND (units.lecturer_id::text = auth.uid()::text OR 
             EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin'))
    )
);

CREATE POLICY "Students can view own performance" ON student_performance FOR SELECT USING (student_id::text = auth.uid()::text);
CREATE POLICY "Lecturers can view student performance in their units" ON student_performance FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM units 
        WHERE units.id = student_performance.unit_id 
        AND (units.lecturer_id::text = auth.uid()::text OR 
             EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin'))
    )
);

CREATE POLICY "Users can view own report logs" ON report_generation_log FOR SELECT USING (generated_by::text = auth.uid()::text);
CREATE POLICY "Users can insert own report logs" ON report_generation_log FOR INSERT WITH CHECK (generated_by::text = auth.uid()::text);

CREATE POLICY "Users can view own engagement metrics" ON engagement_metrics FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can insert own engagement metrics" ON engagement_metrics FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS void AS $$
BEGIN
    -- Update system analytics for today
    INSERT INTO system_analytics (
        date, total_users, total_students, total_lecturers, total_units,
        total_enrollments, total_assignments, total_assessments,
        total_submissions, total_attempts, total_resources, total_downloads, total_messages
    )
    SELECT 
        CURRENT_DATE,
        (SELECT COUNT(*) FROM users),
        (SELECT COUNT(*) FROM users WHERE role = 'student'),
        (SELECT COUNT(*) FROM users WHERE role = 'lecturer'),
        (SELECT COUNT(*) FROM units),
        (SELECT COUNT(*) FROM unit_enrollments WHERE status = 'active'),
        (SELECT COUNT(*) FROM assignments),
        (SELECT COUNT(*) FROM assessments),
        (SELECT COUNT(*) FROM assignment_submissions),
        (SELECT COUNT(*) FROM assessment_attempts),
        (SELECT COUNT(*) FROM learning_resources),
        (SELECT COUNT(*) FROM resource_downloads),
        (SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE)
    ON CONFLICT (date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        total_students = EXCLUDED.total_students,
        total_lecturers = EXCLUDED.total_lecturers,
        total_units = EXCLUDED.total_units,
        total_enrollments = EXCLUDED.total_enrollments,
        total_assignments = EXCLUDED.total_assignments,
        total_assessments = EXCLUDED.total_assessments,
        total_submissions = EXCLUDED.total_submissions,
        total_attempts = EXCLUDED.total_attempts,
        total_resources = EXCLUDED.total_resources,
        total_downloads = EXCLUDED.total_downloads,
        total_messages = EXCLUDED.total_messages;
END;
$$ LANGUAGE plpgsql;
