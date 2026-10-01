-- Task 5: Requirements Review & Approval Baseline
-- Adds review_data, decisions, approved_at, approved_by to project_documents
-- Also ensures status and created_by exist as they were missing from the live DB

ALTER TABLE project_documents
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS review_data jsonb,
  ADD COLUMN IF NOT EXISTS decisions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;
