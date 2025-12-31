import { createClient } from '@supabase/supabase-js';
import { getEnvConfig } from '../config/env';

const { supabaseUrl, supabaseAnonKey } = getEnvConfig();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key not found in environment variables. Database features will fail.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
