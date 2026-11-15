import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

/** Alias matching common Supabase starter naming. */
export const supabase = {
  get client() {
    return getSupabaseBrowserClient();
  },
};

export { getSupabaseBrowserClient, isSupabaseConfigured };
