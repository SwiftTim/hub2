-- Insert sample research projects
INSERT INTO research_projects (id, title, description, status, created_by, unit_id, created_at, updated_at) VALUES
('proj_1', 'Machine Learning in Healthcare', 'Exploring applications of ML algorithms in medical diagnosis and treatment optimization', 'active', 'user_lecturer_1', 'unit_cs101', NOW(), NOW()),
('proj_2', 'Sustainable Energy Systems', 'Research on renewable energy integration and smart grid technologies', 'active', 'user_lecturer_2', 'unit_eng201', NOW(), NOW()),
('proj_3', 'Digital Marketing Analytics', 'Analysis of consumer behavior patterns in digital marketing campaigns', 'planning', 'user_lecturer_1', 'unit_bus301', NOW(), NOW());

-- Insert research collaborators
INSERT INTO research_collaborators (research_project_id, user_id, role, joined_at) VALUES
('proj_1', 'user_student_1', 'researcher', NOW()),
('proj_1', 'user_student_2', 'researcher', NOW()),
('proj_2', 'user_student_3', 'researcher', NOW()),
('proj_3', 'user_student_1', 'researcher', NOW());

-- Insert research documents
INSERT INTO research_documents (id, research_project_id, title, file_url, document_type, uploaded_by, created_at) VALUES
('doc_1', 'proj_1', 'Literature Review - ML in Healthcare', '/research/ml-healthcare-review.pdf', 'literature_review', 'user_lecturer_1', NOW()),
('doc_2', 'proj_1', 'Dataset Analysis Results', '/research/dataset-analysis.pdf', 'analysis', 'user_student_1', NOW()),
('doc_3', 'proj_2', 'Energy Grid Simulation Model', '/research/grid-simulation.pdf', 'model', 'user_lecturer_2', NOW());
