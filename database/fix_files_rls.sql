-- Fix RLS policies for public.files (Consolidated Fix)
-- Purpose: Create folder access helper and allow file uploads/management.
-- This script is self-contained and includes dependencies.
-- Date: 2026-01-02

-- 1. Create folder_access table if not exists (Dependency)
create table if not exists public.folder_access (
  id uuid default uuid_generate_v4() primary key,
  folder_id uuid references public.folders(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  access_level text default 'viewer' check (access_level in ('viewer', 'editor', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  granted_by uuid references public.profiles(id),
  unique(folder_id, user_id)
);

-- Enable RLS for folder_access
alter table public.folder_access enable row level security;

-- 2. Create has_folder_access helper function (Dependency)
create or replace function public.has_folder_access(f_id uuid, u_id uuid)
returns boolean as $$
declare
  v_parent_id uuid;
begin
  -- 1. Check if user is superuser
  if exists (select 1 from public.profiles where id = u_id and role = 'superuser') then
    return true;
  end if;

  -- 2. Check direct permission on this folder
  if exists (select 1 from public.folder_access where folder_id = f_id and user_id = u_id) then
    return true;
  end if;

  -- 3. Check if user is the owner
  if exists (select 1 from public.folders where id = f_id and owner_id = u_id) then
    return true;
  end if;

  -- 4. Recursive check (Check parent)
  select parent_id into v_parent_id from public.folders where id = f_id;
  
  if v_parent_id is not null then
    return public.has_folder_access(v_parent_id, u_id);
  end if;

  return false;
end;
$$ language plpgsql security definer;

-- 3. Fix policies for public.files
alter table public.files enable row level security;

drop policy if exists "Users view accessible files" on public.files;
drop policy if exists "Superusers manage files" on public.files;
drop policy if exists "Users can insert files in accessible folders" on public.files;
drop policy if exists "Users can update/delete their own files" on public.files;

-- Policy: SELECT
create policy "Users view accessible files"
on public.files for select
using (public.has_folder_access(folder_id, auth.uid()));

-- Policy: Superuser ALL
create policy "Superusers manage files"
on public.files for all
using (public.is_superuser())
with check (public.is_superuser());

-- Policy: INSERT
create policy "Users can insert files in accessible folders"
on public.files for insert
with check (
    folder_id is not null AND 
    public.has_folder_access(folder_id, auth.uid())
);

-- Policy: UPDATE/DELETE
create policy "Users can update/delete their own files"
on public.files for all
using (
    uploaded_by = auth.uid() OR 
    (folder_id is not null AND public.has_folder_access(folder_id, auth.uid()))
);

comment on function public.has_folder_access is 'Checks if a user has access to a folder, including inheritance and ownership.';
