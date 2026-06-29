import "server-only";

import { cache } from "react";
import { extractHostname, getFallbackAppSettings, settingsRowToAppSettings } from "@/lib/app-settings";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { appConfig } from "@/lib/app-config";

export const getAppSettings = cache(async function getAppSettings() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return getFallbackAppSettings();
  }

  const hostname = extractHostname(appConfig.publicUrl);
  console.log("[app-settings] buscando tenant_domain:", hostname);

  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("tenant_domain", hostname)
    .maybeSingle();

  if (error) {
    console.error("[app-settings] erro ao buscar tenant_domain:", hostname, error.message);
    return getFallbackAppSettings();
  }

  if (!data) {
    console.warn("[app-settings] nenhum registro encontrado para tenant_domain:", hostname);
  }

  return settingsRowToAppSettings(data);
});
