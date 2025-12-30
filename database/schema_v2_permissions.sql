-- Table: folder_access
-- Manages explicit permissions for users on folders
create table if not exists public.folder_access (
  id uuid default uuid_generate_v4() primary key,
  folder_id uuid references public.folders(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  access_level text default 'viewer' check (access_level in ('viewer', 'editor', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  granted_by uuid references public.profiles(id),
  
  unique(folder_id, user_id)
);

-- RLS Policies for folder_access
alter table public.folder_access enable row level security;

-- Superusers can do everything
drop policy if exists "Superusers manage folder access" on public.folder_access;
create policy "Superusers manage folder access"
on public.folder_access for all
using (public.is_superuser());

-- Users can see their own permissions
drop policy if exists "Users view own permissions" on public.folder_access;
create policy "Users view own permissions"
on public.folder_access for select
using (auth.uid() = user_id);

-- Update folder and file policies to respect folder_access (with inheritance)
-- Note: Recursive check in SQL can be complex. We'll use a helper function.

create or replace function public.has_folder_access(f_id uuid, u_id uuid)
returns boolean as $$
declare
  parent_id uuid;
  has_perm boolean;
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
  select folders.parent_id into parent_id from public.folders where id = f_id;
  
  if parent_id is not null then
    return public.has_folder_access(parent_id, u_id);
  end if;

  return false;
end;
$$ language plpgsql security definer;

-- Update folder select policy
drop policy if exists "Users view accessible folders" on public.folders;
create policy "Users view accessible folders"
on public.folders for select
using (public.has_folder_access(id, auth.uid()));

-- Update file select policy
drop policy if exists "Users view accessible files" on public.files;
create policy "Users view accessible files"
on public.files for select
using (public.has_folder_access(folder_id, auth.uid()));
