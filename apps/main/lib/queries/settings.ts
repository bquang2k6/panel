import { createAdminClient as createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types/admin";

const SETTINGS_KEY = "app_settings";

/**
 * Lấy cài đặt ứng dụng từ bảng app_config.
 */
export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .single();

  if (error) throw error;

  return data.value as AppSettings;
}

/**
 * Cập nhật cài đặt ứng dụng.
 */
export async function updateAppSettings(
  settings: Partial<AppSettings>,
): Promise<AppSettings> {
  const supabase = await createClient();

  const current = await getAppSettings();
  const updated = { ...current, ...settings };

  const { error } = await supabase
    .from("app_config")
    .upsert({ key: SETTINGS_KEY, value: updated });

  if (error) throw error;

  return updated;
}
