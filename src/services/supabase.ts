import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yjwnhkdqjflpkbdbuuun.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqd25oa2RxamZscGtiZGJ1dXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NjE3NDYsImV4cCI6MjEwMzQzNzc0Nn0.v_48mc_vxhIEPqadFEKrJyuq_j3jKn_JD0LZ02J6heQ';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
