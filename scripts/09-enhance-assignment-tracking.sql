-- Add assignment analytics and tracking
CREATE TABLE IF NOT EXISTS assignment_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    total_enrolled INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    on_time_submissions INTEGER DEFAULT 0,
    late_submissions INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    completion_rate DECIMAL(5,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update assignment analytics
CREATE OR REPLACE FUNCTION update_assignment_analytics(assignment_uuid UUID)
RETURNS void AS $$
DECLARE
    enrolled_count INTEGER;
    submission_count INTEGER;
    on_time_count INTEGER;
    late_count INTEGER;
    avg_score DECIMAL(5,2);
    completion_rate DECIMAL(5,2);
    assignment_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get assignment due date
    SELECT due_date INTO assignment_due_date
    FROM assignments WHERE id = assignment_uuid;
    
    -- Count enrolled students for this assignment's unit
    SELECT COUNT(*) INTO enrolled_count
    FROM unit_enrollments ue
    JOIN assignments a ON a.unit_id = ue.unit_id
    WHERE a.id = assignment_uuid AND ue.status = 'active';
    
    -- Count total submissions
    SELECT COUNT(*) INTO submission_count
    FROM assignment_submissions
    WHERE assignment_id = assignment_uuid;
    
    -- Count on-time vs late submissions
    SELECT 
        COUNT(CASE WHEN submitted_at <= assignment_due_date THEN 1 END),
        COUNT(CASE WHEN submitted_at > assignment_due_date THEN 1 END)
    INTO on_time_count, late_count
    FROM assignment_submissions
    WHERE assignment_id = assignment_uuid;
    
    -- Calculate average score
    SELECT AVG(score) INTO avg_score
    FROM assignment_submissions
    WHERE assignment_id = assignment_uuid AND score IS NOT NULL;
    
    -- Calculate completion rate
    completion_rate := CASE 
        WHEN enrolled_count > 0 THEN (submission_count::DECIMAL / enrolled_count::DECIMAL) * 100
        ELSE 0
    END;
    
    -- Insert or update analytics
    INSERT INTO assignment_analytics (
        assignment_id, total_enrolled, total_submissions, 
        on_time_submissions, late_submissions, average_score, completion_rate
    )
    VALUES (
        assignment_uuid, enrolled_count, submission_count,
        on_time_count, late_count, avg_score, completion_rate
    )
    ON CONFLICT (assignment_id) DO UPDATE SET
        total_enrolled = EXCLUDED.total_enrolled,
        total_submissions = EXCLUDED.total_submissions,
        on_time_submissions = EXCLUDED.on_time_submissions,
        late_submissions = EXCLUDED.late_submissions,
        average_score = EXCLUDED.average_score,
        completion_rate = EXCLUDED.completion_rate,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update analytics when submissions change
CREATE OR REPLACE FUNCTION trigger_update_assignment_analytics()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_assignment_analytics(COALESCE(NEW.assignment_id, OLD.assignment_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_submission_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION trigger_update_assignment_analytics();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_analytics_assignment ON assignment_analytics(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
