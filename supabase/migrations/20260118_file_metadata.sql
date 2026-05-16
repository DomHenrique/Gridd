-- Add metadata columns for various file types
ALTER TABLE public.photos
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS size BIGINT,
ADD COLUMN IF NOT EXISTS original_name TEXT;

-- Update existing rows (optional, maybe try to guess or leave null)
-- For now, we leave them NULL or default to 'image/jpeg' if we want, but NULL is safer.
