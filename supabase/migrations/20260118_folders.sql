CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE, -- Nullable for root folders
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Add folder_id to Photos
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Folders

-- Read: If you can access the client, you can access its folders
CREATE POLICY "Read folders based on client access" ON public.folders
  FOR SELECT TO authenticated
  USING (
    public.has_client_access(client_id::text)
  );

-- Insert: If you can access the client, you can create folders
CREATE POLICY "Create folders based on client access" ON public.folders
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_client_access(client_id::text)
  );

-- Update: If you can access the client, you can rename folders
CREATE POLICY "Update folders based on client access" ON public.folders
  FOR UPDATE TO authenticated
  USING (
    public.has_client_access(client_id::text)
  );

-- Delete: If you can access the client, you can delete folders (or restrict to admin later)
CREATE POLICY "Delete folders based on client access" ON public.folders
  FOR DELETE TO authenticated
  USING (
    public.has_client_access(client_id::text)
  );
