-- This script updates the learning resources functionality.
-- It removes the old download_count and adds a new table to track individual downloads.

-- Remove download_count from learning_resources as it is now redundant
ALTER TABLE learning_resources DROP COLUMN IF EXISTS download_count;

-- Create resource downloads table to track student engagement
CREATE TABLE IF NOT EXISTS resource_downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resource_downloads_resource ON resource_downloads(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_user ON resource_downloads(user_id);

-- Enable RLS
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;

-- Policies for resource_downloads
-- Users can see their own downloads
CREATE POLICY "Users can see own downloads" ON resource_downloads FOR SELECT USING (user_id::text = auth.uid()::text);

-- Users can insert their own downloads
CREATE POLICY "Users can insert own downloads" ON resource_downloads FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Lecturers can see all downloads for their units
CREATE POLICY "Lecturers can see downloads for their units" ON resource_downloads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM learning_resources
    JOIN units ON learning_resources.unit_id = units.id
    WHERE learning_resources.id = resource_downloads.resource_id
    AND (
      units.lecturer_id::text = auth.uid()::text OR
      EXISTS (SELECT 1 FROM users WHERE users.id::text = auth.uid()::text AND users.role = 'admin')
    )
  )
);
