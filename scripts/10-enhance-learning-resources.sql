-- Add resource categories and tags for better organization
ALTER TABLE learning_resources 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'unit' CHECK (access_level IN ('unit', 'department', 'public'));

-- Create resource categories table
CREATE TABLE IF NOT EXISTS resource_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO resource_categories (name, description, color, icon) VALUES
('Lecture Notes', 'Course lecture materials and notes', '#3B82F6', 'FileText'),
('Assignments', 'Assignment instructions and templates', '#8B5CF6', 'ClipboardList'),
('Readings', 'Required and supplementary reading materials', '#10B981', 'BookOpen'),
('Videos', 'Video lectures and tutorials', '#EF4444', 'Video'),
('Presentations', 'Slide presentations and visual materials', '#F59E0B', 'Presentation'),
('References', 'Reference materials and external links', '#6B7280', 'Link')
ON CONFLICT (name) DO NOTHING;

-- Create resource views/analytics table
CREATE TABLE IF NOT EXISTS resource_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    view_duration INTEGER, -- in seconds
    ip_address INET
);

-- Create resource ratings table
CREATE TABLE IF NOT EXISTS resource_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);

-- Create resource bookmarks table
CREATE TABLE IF NOT EXISTS resource_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resource_views_resource ON resource_views(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_views_user ON resource_views(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource ON resource_ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_user ON resource_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_category ON learning_resources(category);
CREATE INDEX IF NOT EXISTS idx_learning_resources_tags ON learning_resources USING GIN(tags);

-- Enable RLS on new tables
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for resource views
CREATE POLICY "Users can view own resource views" ON resource_views FOR SELECT USING (user_id::text = auth.uid()::text);
CREATE POLICY "Users can insert own resource views" ON resource_views FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- RLS policies for resource ratings
CREATE POLICY "Users can view resource ratings" ON resource_ratings FOR SELECT USING (true);
CREATE POLICY "Users can manage own ratings" ON resource_ratings FOR ALL USING (user_id::text = auth.uid()::text);

-- RLS policies for resource bookmarks
CREATE POLICY "Users can manage own bookmarks" ON resource_bookmarks FOR ALL USING (user_id::text = auth.uid()::text);

-- RLS policies for resource categories
CREATE POLICY "Everyone can view categories" ON resource_categories FOR SELECT USING (true);

-- Create function to update resource popularity score
CREATE OR REPLACE FUNCTION calculate_resource_popularity(resource_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    download_count INTEGER;
    view_count INTEGER;
    rating_avg DECIMAL;
    bookmark_count INTEGER;
    popularity_score DECIMAL;
BEGIN
    -- Get download count
    SELECT COUNT(*) INTO download_count
    FROM resource_downloads WHERE resource_id = resource_uuid;
    
    -- Get view count
    SELECT COUNT(*) INTO view_count
    FROM resource_views WHERE resource_id = resource_uuid;
    
    -- Get average rating
    SELECT AVG(rating) INTO rating_avg
    FROM resource_ratings WHERE resource_id = resource_uuid;
    
    -- Get bookmark count
    SELECT COUNT(*) INTO bookmark_count
    FROM resource_bookmarks WHERE resource_id = resource_uuid;
    
    -- Calculate popularity score (weighted formula)
    popularity_score := 
        (download_count * 3) + 
        (view_count * 1) + 
        (COALESCE(rating_avg, 0) * 2) + 
        (bookmark_count * 2);
    
    RETURN popularity_score;
END;
$$ LANGUAGE plpgsql;
