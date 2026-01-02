-- Migration: Add Google Photos integration fields to folders and files
-- Date: 2026-01-02

-- Add google_album_id to folders to map local folders to Google Photos Albums
alter table public.folders 
add column if not exists google_album_id text;

-- Add google_media_item_id to files to map local files to Google Photos Media Items
alter table public.files 
add column if not exists google_media_item_id text;

-- Index for faster lookups
create index if not exists idx_folders_google_album_id on public.folders(google_album_id);
create index if not exists idx_files_google_media_item_id on public.files(google_media_item_id);

comment on column public.folders.google_album_id is 'The ID of the corresponding Google Photos Album.';
comment on column public.files.google_media_item_id is 'The ID of the corresponding Google Photos Media Item.';
