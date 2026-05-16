-- ==============================================================================
-- SCHEMA CREATION SCRIPT
-- ==============================================================================
-- Usage: Run this in the Supabase SQL Editor.
-- Note: This script resets/creates the public schema tables.
--       Backup your data if running on a production database with existing data.

-- 1. CLEANUP (Optional - Uncomment if starting fresh on an existing DB)
-- DROP TABLE IF EXISTS public.photos;
-- DROP TABLE IF EXISTS public.clients;
-- DROP TABLE IF EXISTS public.profiles;
-- DROP TABLE IF EXISTS public.users; -- Dropping the old legacy table

-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- Create Custom Enum Types
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: public.profiles
-- Description: Extends auth.users to store application-specific user data.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text, -- Copied from auth.users for easier queries
  name text,
  role public.user_role DEFAULT 'user'::public.user_role,
  allowed_client_ids text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: public.clients
-- Description: Stores client/campaign information.
CREATE TABLE IF NOT EXISTS public.clients (
  id text PRIMARY KEY, -- Using text ID to match frontend generation logic (or can switch to uuid)
  name text NOT NULL,
  description text,
  cover_image text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Table: public.photos
-- Description: Stores photos associated with clients.
CREATE TABLE IF NOT EXISTS public.photos (
  id text PRIMARY KEY, -- Using text ID to match frontend
  client_id text REFERENCES public.clients(id) ON DELETE CASCADE,
  url text NOT NULL,
  uploaded_by text, -- Can store user name or ID. Storing Name for now to match legacy, or better: store ID.
  uploaded_by_id uuid REFERENCES public.profiles(id), -- New proper reference
  tags text[] DEFAULT '{}'::text[],
  timestamp timestamptz DEFAULT now()
);

-- ==============================================================================
-- 3. TRIGGERS & FUNCTIONS
-- ==============================================================================

-- Function: Handle New User
-- Description: Automatically creates a profile row when a new user signs up via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name', -- Assumes metadata contains 'name'
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function: is_admin_or_manager()
-- Description: Usage in RLS policies to check privileges.
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean AS $$
SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid()
  AND role IN ('admin', 'manager')
);
$$ LANGUAGE sql SECURITY DEFINER;

-- Function: has_client_access(client_id)
-- Description: Checks if the current user has access to a specific client.
CREATE OR REPLACE FUNCTION public.has_client_access(target_client_id text)
RETURNS boolean AS $$
BEGIN
  -- Admin/Manager has access to everything
  IF public.is_admin_or_manager() THEN
    RETURN true;
  END IF;
  
  -- Regular users check their allowed list
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND target_client_id = ANY(allowed_client_ids)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- --- Policies for PROFILES ---

-- Read: Authenticated users can read all profiles (to see team members).
CREATE POLICY "Allow read access for authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Update: Only Admins can update any profile (roles/permissions). 
-- Users can update their own name (optional, simplified here to Admin/Manager or Self).
CREATE POLICY "Allow update for admins or self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.is_admin_or_manager() OR auth.uid() = id
  )
  WITH CHECK (
    public.is_admin_or_manager() OR auth.uid() = id
    -- Note: Ideally prevent non-admins from changing their own role here.
    -- Supabase needs a separate Trigger or Column-Level Security for strict role protection.
  );

-- Insert: Handled by Trigger, but explicit insert can be Admin only.
CREATE POLICY "Allow insert for admins/service_role" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_manager());


-- --- Policies for CLIENTS ---

-- Read: Users can read clients they are allowed to see.
CREATE POLICY "Read clients based on permissions" ON public.clients
  FOR SELECT TO authenticated
  USING (
    public.has_client_access(id)
  );

-- Create: Only Admin/Manager can create clients.
CREATE POLICY "Create clients for admins/managers" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_manager()
  );

-- Update: Only Admin/Manager can update clients.
CREATE POLICY "Update clients for admins/managers" ON public.clients
  FOR UPDATE TO authenticated
  USING (
    public.is_admin_or_manager()
  );

-- Delete: Only Admin/Manager can delete clients.
CREATE POLICY "Delete clients for admins/managers" ON public.clients
  FOR DELETE TO authenticated
  USING (
    public.is_admin_or_manager()
  );


-- --- Policies for PHOTOS ---

-- Read: If you can see the client, you can see the photo.
CREATE POLICY "Read photos based on client access" ON public.photos
  FOR SELECT TO authenticated
  USING (
    public.has_client_access(client_id)
  );

-- Upload (Insert): Users who can see the client can upload photos? 
-- Or only Admin/Manager? App logic: 'user' can upload if they have client access.
CREATE POLICY "Upload photos with client access" ON public.photos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_client_access(client_id)
  );

-- Delete: Admin/Manager can delete any. Users can delete (optional: their own? or any in client?).
-- Implementation here allows delete if you have access to the client, effectively strict collaboration.
CREATE POLICY "Delete photos with client access" ON public.photos
  FOR DELETE TO authenticated
  USING (
    public.has_client_access(client_id)
  );

-- ==============================================================================
-- 5. STORAGE BUCKETS (Optional - If managing storage via SQL)
-- ==============================================================================
-- Insert storage bucket configuration if needed, or manage via Supabase Dashboard.
-- insert into storage.buckets (id, name) values ('photos', 'photos');
-- create policy "Authenticated can upload" on storage.objects for insert to authenticated with check ( bucket_id = 'photos' );
-- create policy "Authenticated can select" on storage.objects for select to authenticated using ( bucket_id = 'photos' );
