-- Insert sample assignments for testing
INSERT INTO assignments (unit_id, title, description, due_date, total_marks, submission_format, max_file_size, allowed_file_types, late_submission_penalty, created_by)
SELECT 
  u.id,
  'Assignment 1 - ' || u.unit_name,
  'Complete the programming exercises and submit your solution files along with a detailed report explaining your approach and methodology.',
  NOW() + INTERVAL '14 days',
  100,
  'both',
  10485760, -- 10MB
  ARRAY['pdf', 'docx', 'txt', 'py', 'java', 'cpp', 'zip'],
  5.00, -- 5% penalty per day
  (SELECT id FROM users WHERE role = 'lecturer' LIMIT 1)
FROM units u
WHERE u.unit_code IN ('CS101', 'CS201', 'MATH101')
LIMIT 3;

-- Insert a past due assignment for testing
INSERT INTO assignments (unit_id, title, description, due_date, total_marks, submission_format, max_file_size, allowed_file_types, late_submission_penalty, created_by)
SELECT 
  u.id,
  'Assignment 0 - Introduction',
  'Write a brief introduction about yourself and your academic goals.',
  NOW() - INTERVAL '2 days',
  50,
  'text',
  5242880, -- 5MB
  ARRAY['pdf', 'docx', 'txt'],
  2.50, -- 2.5% penalty per day
  (SELECT id FROM users WHERE role = 'lecturer' LIMIT 1)
FROM units u
WHERE u.unit_code = 'CS101'
LIMIT 1;
