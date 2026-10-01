CREATE TABLE IF NOT EXISTS coding_agent_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'created',
    workspace_id text,
    source_document_ids jsonb NOT NULL,
    current_task_id text,
    started_at timestamptz,
    completed_at timestamptz,
    error jsonb,
    summary text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coding_agent_tasks (
    id text PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES coding_agent_sessions(id) ON DELETE CASCADE,
    engineering_task_id text NOT NULL,
    title text NOT NULL,
    phase text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    dependencies jsonb DEFAULT '[]'::jsonb,
    attempt integer DEFAULT 0,
    files_expected jsonb DEFAULT '[]'::jsonb,
    files_changed jsonb DEFAULT '[]'::jsonb,
    validation_status jsonb,
    error jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coding_agent_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES coding_agent_sessions(id) ON DELETE CASCADE,
    task_id text,
    event_type text NOT NULL,
    payload jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE coding_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sessions in their projects" ON coding_agent_sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = coding_agent_sessions.project_id
            AND project_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage tasks in their projects" ON coding_agent_tasks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM coding_agent_sessions s
            JOIN project_members pm ON s.project_id = pm.project_id
            WHERE s.id = coding_agent_tasks.session_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage events in their projects" ON coding_agent_events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM coding_agent_sessions s
            JOIN project_members pm ON s.project_id = pm.project_id
            WHERE s.id = coding_agent_events.session_id
            AND pm.user_id = auth.uid()
        )
    );