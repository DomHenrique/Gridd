
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // In dev / build time this might trigger, but we want to fail fast in runtime if missing
  console.warn('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
