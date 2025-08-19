-- Create comprehensive research tools and academic features tables

-- Citation management
CREATE TABLE IF NOT EXISTS citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    research_project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    citation_style VARCHAR(20) NOT NULL CHECK (citation_style IN ('apa', 'mla', 'chicago', 'harvard', 'ieee')),
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('journal', 'book', 'website', 'conference', 'thesis')),
    title TEXT NOT NULL,
    authors TEXT[],
    publication_year INTEGER,
    journal_name VARCHAR(255),
    volume VARCHAR(50),
    issue VARCHAR(50),
    pages VARCHAR(50),
    publisher VARCHAR(255),
    doi VARCHAR(255),
    url TEXT,
    isbn VARCHAR(20),
    formatted_citation TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plagiarism check results
CREATE TABLE IF NOT EXISTS plagiarism_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    research_project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    document_title VARCHAR(255),
    text_content TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    overall_similarity_score DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    sources_found JSONB, -- Array of matched sources
    detailed_report JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Literature search history
CREATE TABLE IF NOT EXISTS literature_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    research_project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    search_filters JSONB, -- Subject area, date range, publication type, etc.
    results_count INTEGER DEFAULT 0,
    search_results JSONB, -- Array of found papers
    saved_papers UUID[], -- Array of paper IDs saved by user
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academic writing assistance
CREATE TABLE IF NOT EXISTS writing_assistance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    research_project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('thesis', 'paper', 'proposal', 'report', 'essay')),
    content TEXT NOT NULL,
    assistance_type VARCHAR(50) NOT NULL CHECK (assistance_type IN ('grammar', 'style', 'structure', 'readability', 'citations')),
    suggestions JSONB NOT NULL, -- Array of suggestions with positions and improvements
    readability_score DECIMAL(5,2),
    word_count INTEGER,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research data analysis
CREATE TABLE IF NOT EXISTS data_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    research_project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    analysis_name VARCHAR(255) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('descriptive', 'correlation', 'regression', 'anova', 'chi_square', 'custom')),
    dataset_info JSONB NOT NULL, -- Metadata about the dataset
    analysis_parameters JSONB, -- Parameters used for analysis
    results JSONB NOT NULL, -- Analysis results and statistics
    visualizations JSONB, -- Chart configurations and data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academic reference library
CREATE TABLE IF NOT EXISTS reference_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT[],
    publication_year INTEGER,
    journal_name VARCHAR(255),
    abstract TEXT,
    keywords TEXT[],
    doi VARCHAR(255),
    url TEXT,
    pdf_url TEXT,
    citation_count INTEGER DEFAULT 0,
    impact_factor DECIMAL(5,3),
    subject_areas TEXT[],
    document_type VARCHAR(50) CHECK (document_type IN ('journal_article', 'conference_paper', 'book', 'thesis', 'report')),
    tags TEXT[],
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research collaboration invitations
CREATE TABLE IF NOT EXISTS collaboration_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    research_project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
    invited_user_email VARCHAR(255) NOT NULL,
    invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'reviewer', 'supervisor')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    invitation_message TEXT,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Research milestones and progress tracking
CREATE TABLE IF NOT EXISTS research_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    research_project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_citations_user ON citations(user_id);
CREATE INDEX IF NOT EXISTS idx_citations_project ON citations(research_project_id);
CREATE INDEX IF NOT EXISTS idx_citations_style ON citations(citation_style);
CREATE INDEX IF NOT EXISTS idx_plagiarism_checks_user ON plagiarism_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_literature_searches_user ON literature_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_literature_searches_project ON literature_searches(research_project_id);
CREATE INDEX IF NOT EXISTS idx_writing_assistance_user ON writing_assistance(user_id);
CREATE INDEX IF NOT EXISTS idx_data_analysis_user ON data_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_data_analysis_project ON data_analysis(research_project_id);
CREATE INDEX IF NOT EXISTS idx_reference_library_user ON reference_library(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_library_keywords ON reference_library USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_reference_library_tags ON reference_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_project ON collaboration_invitations(research_project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_email ON collaboration_invitations(invited_user_email);
CREATE INDEX IF NOT EXISTS idx_research_milestones_project ON research_milestones(research_project_id);
CREATE INDEX IF NOT EXISTS idx_research_milestones_assigned ON research_milestones(assigned_to);

-- Enable RLS on all tables
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plagiarism_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE literature_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_assistance ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for citations
CREATE POLICY "Users can manage own citations" ON citations FOR ALL USING (user_id::text = auth.uid()::text);
CREATE POLICY "Project collaborators can view citations" ON citations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM research_collaborators 
        WHERE research_collaborators.research_project_id = citations.research_project_id 
        AND research_collaborators.user_id::text = auth.uid()::text
    )
);

-- RLS policies for plagiarism checks
CREATE POLICY "Users can manage own plagiarism checks" ON plagiarism_checks FOR ALL USING (user_id::text = auth.uid()::text);

-- RLS policies for literature searches
CREATE POLICY "Users can manage own literature searches" ON literature_searches FOR ALL USING (user_id::text = auth.uid()::text);

-- RLS policies for writing assistance
CREATE POLICY "Users can manage own writing assistance" ON writing_assistance FOR ALL USING (user_id::text = auth.uid()::text);

-- RLS policies for data analysis
CREATE POLICY "Users can manage own data analysis" ON data_analysis FOR ALL USING (user_id::text = auth.uid()::text);
CREATE POLICY "Project collaborators can view data analysis" ON data_analysis FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM research_collaborators 
        WHERE research_collaborators.research_project_id = data_analysis.research_project_id 
        AND research_collaborators.user_id::text = auth.uid()::text
    )
);

-- RLS policies for reference library
CREATE POLICY "Users can manage own reference library" ON reference_library FOR ALL USING (user_id::text = auth.uid()::text);

-- RLS policies for collaboration invitations
CREATE POLICY "Users can view invitations sent to them" ON collaboration_invitations FOR SELECT USING (
    invited_user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    invited_user_id::text = auth.uid()::text OR
    invited_by::text = auth.uid()::text
);
CREATE POLICY "Users can create invitations for their projects" ON collaboration_invitations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM research_projects 
        WHERE research_projects.id = collaboration_invitations.research_project_id 
        AND research_projects.created_by::text = auth.uid()::text
    )
);

-- RLS policies for research milestones
CREATE POLICY "Project members can view milestones" ON research_milestones FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM research_projects 
        WHERE research_projects.id = research_milestones.research_project_id 
        AND (research_projects.created_by::text = auth.uid()::text OR
             EXISTS (SELECT 1 FROM research_collaborators 
                    WHERE research_collaborators.research_project_id = research_projects.id 
                    AND research_collaborators.user_id::text = auth.uid()::text))
    )
);
CREATE POLICY "Project creators can manage milestones" ON research_milestones FOR ALL USING (
    EXISTS (
        SELECT 1 FROM research_projects 
        WHERE research_projects.id = research_milestones.research_project_id 
        AND research_projects.created_by::text = auth.uid()::text
    )
);

-- Function to update research project activity
CREATE OR REPLACE FUNCTION update_research_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the research project's updated_at timestamp
    UPDATE research_projects 
    SET updated_at = NOW() 
    WHERE id = COALESCE(NEW.research_project_id, OLD.research_project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update research project activity
CREATE TRIGGER update_research_activity_citations
    AFTER INSERT OR UPDATE OR DELETE ON citations
    FOR EACH ROW EXECUTE FUNCTION update_research_activity();

CREATE TRIGGER update_research_activity_documents
    AFTER INSERT OR UPDATE OR DELETE ON research_documents
    FOR EACH ROW EXECUTE FUNCTION update_research_activity();

CREATE TRIGGER update_research_activity_milestones
    AFTER INSERT OR UPDATE OR DELETE ON research_milestones
    FOR EACH ROW EXECUTE FUNCTION update_research_activity();
