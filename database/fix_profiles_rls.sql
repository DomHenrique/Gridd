-- Fix RLS policies for public.profiles, activity_logs and notifications
-- Purpose: Allow superusers to create/manage profiles and secure logs/notifications.
-- Date: 2026-01-13

-- 1. Ensure profiles has correct superuser policies
alter table public.profiles enable row level security;

-- SELECT: Superusers can view all profiles (Already exists but good to reinforce)
drop policy if exists "Superusers can view all profiles" on public.profiles;
create policy "Superusers can view all profiles" on public.profiles for select 
using (public.is_superuser());

-- INSERT: This was missing! Allows superusers to create profiles for other users.
drop policy if exists "Superusers can insert all profiles" on public.profiles;
create policy "Superusers can insert all profiles" on public.profiles for insert 
with check (public.is_superuser());

-- UPDATE: Allows superusers to update profiles (e.g., change roles)
drop policy if exists "Superusers can update all profiles" on public.profiles;
create policy "Superusers can update all profiles" on public.profiles for update
using (public.is_superuser());

-- DELETE: Allows superusers to delete profiles
drop policy if exists "Superusers can delete all profiles" on public.profiles;
create policy "Superusers can delete all profiles" on public.profiles for delete
using (public.is_superuser());


-- 2. Secure activity_logs
alter table public.activity_logs enable row level security;

drop policy if exists "Users can view own activity" on public.activity_logs;
create policy "Users can view own activity" on public.activity_logs for select
using (auth.uid() = user_id);

drop policy if exists "Superusers can view all activity" on public.activity_logs;
create policy "Superusers can view all activity" on public.activity_logs for select
using (public.is_superuser());

drop policy if exists "Any authenticated user can insert activity" on public.activity_logs;
create policy "Any authenticated user can insert activity" on public.activity_logs for insert
with check (auth.role() = 'authenticated');


-- 3. Secure notifications
alter table public.notifications enable row level security;

drop policy if exists "Users can view and manage own notifications" on public.notifications;
create policy "Users can view and manage own notifications" on public.notifications for all
using (auth.uid() = user_id);

drop policy if exists "Superusers manage all notifications" on public.notifications;
create policy "Superusers manage all notifications" on public.notifications for all
using (public.is_superuser());


-- 4. Re-verify lead policies (Safety)
alter table public.leads enable row level security;
drop policy if exists "Allow superuser to view leads" on public.leads;
create policy "Allow superuser to view leads" on public.leads for select
using (public.is_superuser());
