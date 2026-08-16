import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses Row Level Security entirely. Server-only:
// never import this from a 'use client' component or any code that ships
// to the browser, since SUPABASE_SERVICE_ROLE_KEY must stay off the client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
