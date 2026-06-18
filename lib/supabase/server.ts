import { createClient } from "@supabase/supabase-js";
import { appConfig } from "@/lib/app-config";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseAdminClient() {
  if (!appConfig.supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(appConfig.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
