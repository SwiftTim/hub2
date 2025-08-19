-- Create table for generated reports with watermarking
CREATE TABLE IF NOT EXISTS generated_reports (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    document_hash VARCHAR(64) NOT NULL,
    watermark_signature VARCHAR(64) NOT NULL,
    file_size INTEGER,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create table for document verification logs
CREATE TABLE IF NOT EXISTS document_verifications (
    id SERIAL PRIMARY KEY,
    document_id UUID REFERENCES generated_reports(id) ON DELETE CASCADE,
    verification_method VARCHAR(50) NOT NULL,
    verification_result BOOLEAN NOT NULL,
    verifier_ip INET,
    verifier_user_agent TEXT,
    verification_details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generated_reports_user_id ON generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_document_verifications_document_id ON document_verifications(document_id);
CREATE INDEX IF NOT EXISTS idx_document_verifications_created_at ON document_verifications(created_at);

-- Create function to update download count
CREATE OR REPLACE FUNCTION increment_download_count(report_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE generated_reports 
    SET download_count = download_count + 1, updated_at = NOW()
    WHERE id = report_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to log document verification
CREATE OR REPLACE FUNCTION log_document_verification(
    doc_id UUID,
    method VARCHAR(50),
    result BOOLEAN,
    ip INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO document_verifications 
    (document_id, verification_method, verification_result, verifier_ip, verifier_user_agent, verification_details, created_at)
    VALUES (doc_id, method, result, ip, user_agent, details, NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE generated_reports IS 'Stores metadata for digitally watermarked reports';
COMMENT ON TABLE document_verifications IS 'Logs all document verification attempts';
COMMENT ON COLUMN generated_reports.document_hash IS 'SHA-256 hash of the watermarked document for integrity verification';
COMMENT ON COLUMN generated_reports.watermark_signature IS 'HMAC signature embedded in the document watermark';
