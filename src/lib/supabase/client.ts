import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

let cachedClient: SupabaseClient<Database> | null = null;

function getSupabaseConfig() {
  const url = process.env.DB_PROJECT_URL;
  const apiKey = process.env.DB_API_KEY;

  if (!url || !apiKey) {
    throw new Error('Supabase credentials are missing. Check DB_PROJECT_URL/DB_API_KEY.');
  }

  return { url, apiKey };
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!cachedClient) {
    const { url, apiKey } = getSupabaseConfig();
    cachedClient = createClient<Database>(url, apiKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return cachedClient;
}
