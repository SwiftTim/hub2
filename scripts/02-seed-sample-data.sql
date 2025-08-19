-- Insert sample units for testing
INSERT INTO units (unit_code, unit_name, description, department, year_level, semester) VALUES
('CS101', 'Introduction to Programming', 'Basic programming concepts using Python', 'Computer Science', 1, 'Semester 1'),
('CS201', 'Data Structures and Algorithms', 'Advanced programming and algorithm design', 'Computer Science', 2, 'Semester 1'),
('MATH101', 'Calculus I', 'Differential and integral calculus', 'Mathematics', 1, 'Semester 1'),
('ENG101', 'Technical Writing', 'Professional communication skills', 'Engineering', 1, 'Semester 1'),
('BUS201', 'Business Analytics', 'Data analysis for business decisions', 'Business', 2, 'Semester 1');

-- Create main unit groups for each unit
INSERT INTO unit_groups (unit_id, group_name, group_type, description)
SELECT 
  id,
  unit_name || ' - Main Group',
  'main',
  'Main discussion group for ' || unit_name
FROM units;

-- Create study groups for each unit
INSERT INTO unit_groups (unit_id, group_name, group_type, description)
SELECT 
  id,
  unit_name || ' - Study Group',
  'study',
  'Study group for ' || unit_name
FROM units;
