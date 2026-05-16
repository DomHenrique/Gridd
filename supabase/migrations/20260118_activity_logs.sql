-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'upload', 'delete', 'create_folder', 'delete_folder'
    details JSONB DEFAULT '{}'::jsonb, -- Store file names, folder names, etc.
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins and Managers can view all logs
CREATE POLICY "Admins and Managers can view all logs" ON activity_logs
    FOR SELECT USING (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'manager')
        )
    );

-- Users can view logs for clients they have access to
CREATE POLICY "Users can view logs for allowed clients" ON activity_logs
    FOR SELECT USING (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role = 'user'
            and activity_logs.client_id = any(profiles.allowed_client_ids)
        )
    );

-- Insert policy: Authenticated users can insert logs
CREATE POLICY "Authenticated users can insert logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
