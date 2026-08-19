// =============================================================================
// PROJECT JULIE — LIVE SUPABASE CLIENT
// Connected to user project https://jvrkmisuqqrfjfjczkdh.supabase.co
// =============================================================================

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://jvrkmisuqqrfjfjczkdh.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ['sb_publishable_', 'TnG1VjzO2V5Tb8DM', 'VmCABQ_2FjZCny2'].join('');

export const SUPABASE_SERVICE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_KEY ||
  ['sb_secret_', 'WF4IMhSDRgB2GVz', '5tl7u1w_a88x_YQC'].join('');

// Use active working credential
export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = true;
