import { createClient } from '@supabase/supabase-js';

// These two values come from Vercel's environment variables (set safely
// in the dashboard, never written directly in code).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
