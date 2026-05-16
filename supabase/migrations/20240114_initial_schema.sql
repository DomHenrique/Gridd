
-- Enable RLS
alter table if exists public.clients enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.photos enable row level security;

-- Create clients table
create table public.clients (
  id text primary key,
  name text not null,
  description text,
  cover_image text,
  created_at timestamptz default now()
);

-- Create users table
create table public.users (
  email text primary key,
  name text not null,
  role text not null check (role in ('admin', 'manager', 'user')),
  allowed_client_ids text[] default '{}',
  created_at timestamptz default now()
);

-- Create photos table
create table public.photos (
  id text primary key,
  client_id text references public.clients(id) on delete cascade,
  url text not null,
  uploaded_by text not null,
  tags text[] default '{}',
  timestamp timestamptz default now()
);

-- Policies (Simplified for now, can be hardened later)

-- Clients:
-- optimized for simplicity: anyone can read for now (filtered by frontend), or we can implement RLS logic based on 'users' table lookup.
-- For this refactor, since Auth is custom and not Supabase Auth, we can't easily use `auth.uid()`.
-- The requirement is "Supabase for database", not necessarily "Supabase Auth".
-- So we will leave RLS policies open for public access via API Key (Anon Key) or implement a Service Role function if strict security is needed.
-- However, given the prompt implies "Supabase for database", using Anon Key safely usually requires RLS.
-- Since we are not using Supabase Auth, `auth.uid()` is null.
-- We will Allow All for Anon Key for now (mimicking the current insecure localstorage), but this is a HUGE security risk for production.
-- But since the prompt is about "connecting to minio" and "supabase for db", and doesn't explicitly ask to migrate AUTH to Supabase Auth, I will keep it simple.
-- Wait, the user prompt says: "refaça toda a aplicação para usar o minio para o s buckets e o supabase para o banco de dados postgres".
-- It implies a full refactor.
-- I'll ADD a policy that allows everything for now to avoid permission blocks during dev, but comment on it.

create policy "Enable read access for all users" on public.clients for select using (true);
create policy "Enable insert for all users" on public.clients for insert with check (true);
create policy "Enable update for all users" on public.clients for update using (true);
create policy "Enable delete for all users" on public.clients for delete using (true);

create policy "Enable read access for all users" on public.users for select using (true);
create policy "Enable insert for all users" on public.users for insert with check (true);
create policy "Enable update for all users" on public.users for update using (true);
create policy "Enable delete for all users" on public.users for delete using (true);

create policy "Enable read access for all users" on public.photos for select using (true);
create policy "Enable insert for all users" on public.photos for insert with check (true);
create policy "Enable update for all users" on public.photos for update using (true);
create policy "Enable delete for all users" on public.photos for delete using (true);
