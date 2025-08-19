-- Create users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
  student_id TEXT UNIQUE, -- Only for students
  staff_id TEXT UNIQUE, -- Only for lecturers/admin
  department TEXT,
  year_of_study INTEGER, -- Only for students
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create units/courses table
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_code TEXT UNIQUE NOT NULL,
  unit_name TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL,
  year_level INTEGER NOT NULL,
  semester TEXT NOT NULL,
  lecturer_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unit enrollments (many-to-many relationship)
CREATE TABLE IF NOT EXISTS unit_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  unit_id UUID REFERENCES units(id),
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  UNIQUE(student_id, unit_id)
);

-- Create unit groups (WhatsApp-style chat groups)
CREATE TABLE IF NOT EXISTS unit_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  group_name TEXT NOT NULL,
  group_type TEXT NOT NULL CHECK (group_type IN ('main', 'study', 'project')),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group memberships
CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES unit_groups(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create messages for group chats
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES unit_groups(id),
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'link')),
  file_url TEXT,
  reply_to UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessments (CATs) table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('cat', 'assignment', 'exam')),
  total_marks INTEGER NOT NULL,
  duration_minutes INTEGER, -- For timed assessments
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  instructions TEXT,
  anti_cheat_enabled BOOLEAN DEFAULT true,
  randomize_questions BOOLEAN DEFAULT false,
  show_results BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessment questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
  options JSONB, -- For multiple choice options
  correct_answer TEXT,
  marks INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student assessment attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES assessments(id),
  student_id UUID REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  answers JSONB, -- Store student answers
  time_taken INTEGER, -- In minutes
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  UNIQUE(assessment_id, student_id)
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_marks INTEGER NOT NULL,
  submission_format TEXT NOT NULL CHECK (submission_format IN ('file', 'text', 'both')),
  max_file_size INTEGER DEFAULT 10485760, -- 10MB in bytes
  allowed_file_types TEXT[], -- Array of allowed extensions
  late_submission_penalty DECIMAL(5,2) DEFAULT 0.00,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES users(id),
  submission_text TEXT,
  file_url TEXT,
  file_name TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER,
  feedback TEXT,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
  UNIQUE(assignment_id, student_id)
);

-- Create learning resources table
CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'video', 'link', 'presentation')),
  file_url TEXT,
  external_url TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create research projects table
CREATE TABLE IF NOT EXISTS research_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  supervisor_id UUID REFERENCES users(id),
  student_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'proposal' CHECK (status IN ('proposal', 'approved', 'in_progress', 'completed')),
  start_date DATE,
  expected_completion DATE,
  actual_completion DATE,
  research_area TEXT,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'assessment', 'message', 'grade', 'announcement')),
  related_id UUID, -- Can reference any table
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_unit_enrollments_student ON unit_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_unit_enrollments_unit ON unit_enrollments(unit_id);
CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_assessments_unit ON assessments(unit_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_unit ON assignments(unit_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- Adding Row Level Security policies for data protection
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile and update it
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Students can view units they're enrolled in
CREATE POLICY "Students can view enrolled units" ON units FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM unit_enrollments 
    WHERE unit_enrollments.unit_id = units.id 
    AND unit_enrollments.student_id::text = auth.uid()::text
  ) OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id::text = auth.uid()::text 
    AND users.role IN ('lecturer', 'admin')
  )
);

-- Lecturers can manage their units
CREATE POLICY "Lecturers can manage own units" ON units FOR ALL USING (
  lecturer_id::text = auth.uid()::text OR 
  EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
);

-- Students can view their enrollments
CREATE POLICY "Students can view own enrollments" ON unit_enrollments FOR SELECT USING (
  student_id::text = auth.uid()::text OR
  EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role IN ('lecturer', 'admin'))
);

-- Group access policies
CREATE POLICY "Group members can view groups" ON unit_groups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_memberships.group_id = unit_groups.id 
    AND group_memberships.user_id::text = auth.uid()::text
  )
);

-- Message policies
CREATE POLICY "Group members can view messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_memberships.group_id = messages.group_id 
    AND group_memberships.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "Group members can send messages" ON messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_memberships.group_id = messages.group_id 
    AND group_memberships.user_id::text = auth.uid()::text
  ) AND sender_id::text = auth.uid()::text
);

-- Assessment policies
CREATE POLICY "Students can view available assessments" ON assessments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM unit_enrollments 
    WHERE unit_enrollments.unit_id = assessments.unit_id 
    AND unit_enrollments.student_id::text = auth.uid()::text
  ) OR created_by::text = auth.uid()::text
);

-- Assignment policies  
CREATE POLICY "Students can view unit assignments" ON assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM unit_enrollments 
    WHERE unit_enrollments.unit_id = assignments.unit_id 
    AND unit_enrollments.student_id::text = auth.uid()::text
  ) OR created_by::text = auth.uid()::text
);

-- Notification policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id::text = auth.uid()::text);
