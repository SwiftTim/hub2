-- Enhanced assessment attempts table with security metrics
ALTER TABLE assessment_attempts 
ADD COLUMN IF NOT EXISTS tab_switches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS copy_paste_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS suspicious_activities TEXT[],
ADD COLUMN IF NOT EXISTS keyboard_activity_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS browser_info JSONB,
ADD COLUMN IF NOT EXISTS screen_resolution VARCHAR(20);

-- Create assessment security logs table
CREATE TABLE IF NOT EXISTS assessment_security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Add indexes for security monitoring
CREATE INDEX IF NOT EXISTS idx_security_logs_attempt ON assessment_security_logs(attempt_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON assessment_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON assessment_security_logs(timestamp);

-- Create view for assessment security summary
CREATE OR REPLACE VIEW assessment_security_summary AS
SELECT 
    aa.id as attempt_id,
    aa.assessment_id,
    aa.student_id,
    u.full_name as student_name,
    u.student_id as student_number,
    a.title as assessment_title,
    aa.tab_switches,
    aa.copy_paste_attempts,
    array_length(aa.suspicious_activities, 1) as total_suspicious_activities,
    aa.keyboard_activity_count,
    aa.time_taken,
    aa.submitted_at,
    CASE 
        WHEN aa.tab_switches > 3 OR aa.copy_paste_attempts > 0 OR array_length(aa.suspicious_activities, 1) > 5 
        THEN 'HIGH_RISK'
        WHEN aa.tab_switches > 1 OR array_length(aa.suspicious_activities, 1) > 2
        THEN 'MEDIUM_RISK'
        ELSE 'LOW_RISK'
    END as risk_level
FROM assessment_attempts aa
JOIN users u ON aa.student_id = u.id
JOIN assessments a ON aa.assessment_id = a.id
WHERE aa.status IN ('submitted', 'graded');
