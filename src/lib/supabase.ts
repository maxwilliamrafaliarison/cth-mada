import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (for use in 'use client' components)
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Legacy export for backward compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
