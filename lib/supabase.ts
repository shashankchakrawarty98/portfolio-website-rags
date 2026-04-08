import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // If we're on the server during build, don't crash the build.
  // The app will function correctly once the keys are added in the dashboard.
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn("Supabase credentials missing during build. Skipping initialization.");
  } else {
    // throw new Error('Missing Supabase environment variables')
  }
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;
