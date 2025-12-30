-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: profiles
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'client' check (role in ('superuser', 'client', 'employee')),
  avatar_url text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Secure Storage for App Settings
create table if not exists public.app_settings (
  key text primary key,
  value jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references public.profiles(id)
);

-- Table: folders
create table if not exists public.folders (
  id uuid default uuid_generate_v4() primary key,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null,
  note text,
  owner_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: files
create table if not exists public.files (
  id uuid default uuid_generate_v4() primary key,
  folder_id uuid references public.folders(id) on delete cascade,
  name text not null,
  url text,
  type text,
  size text,
  uploaded_by uuid references public.profiles(id),
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: activity_logs
create table if not exists public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  target_name text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: notifications
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  message text,
  is_read boolean default false,
  user_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to handle profile creation on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case 
      when new.email ilike '%@hnperformancedigital.com.br' then 'superuser'
      else 'client'
    end
  );
  return new;
end;
$$;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.folders enable row level security;
alter table public.files enable row level security;

-- Helper function to check if user is a superuser without infinite recursion
create or replace function public.is_superuser()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'superuser'
  );
end;
$$ language plpgsql security definer;

-- Policies (Improved to avoid recursion)
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select 
using (auth.uid() = id);

drop policy if exists "Superusers can view all profiles" on public.profiles;
create policy "Superusers can view all profiles" on public.profiles for select 
using (public.is_superuser());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert 
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update
using (auth.uid() = id);

drop policy if exists "Superusers full access settings" on public.app_settings;
create policy "Superusers full access settings" on public.app_settings for all 
using (public.is_superuser());

drop policy if exists "Owners manage folders" on public.folders;
create policy "Owners manage folders" on public.folders for all 
using (owner_id = auth.uid());

drop policy if exists "Superusers manage folders" on public.folders;
create policy "Superusers manage folders" on public.folders for all 
using (public.is_superuser());

-- Table: leads
create table if not exists public.leads (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text not null,
  phone text,
  company_name text,
  job_title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for leads
alter table public.leads enable row level security;

-- Allow anyone (including anon) to insert leads
drop policy if exists "Allow public insert to leads" on public.leads;
create policy "Allow public insert to leads"
on public.leads for insert
with check (true);

-- Allow superusers to view leads
drop policy if exists "Allow superuser to view leads" on public.leads;
create policy "Allow superuser to view leads"
on public.leads for select
using (public.is_superuser());
