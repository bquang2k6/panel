import { createAdminClient as createClient } from "@/lib/supabase/server";
import type { ActivityLog, LogLevel } from "@/lib/types/admin";

/**
 * Lấy danh sách activity logs.
 */
export async function getActivityLogs(
  options?: { level?: LogLevel; limit?: number },
): Promise<ActivityLog[]> {
  const supabase = await createClient();

  let query = supabase
    .from("activity_logs")
    .select("id, level, action, user, details, created_at")
    .order("created_at", { ascending: false });

  if (options?.level) {
    query = query.eq("level", options.level);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}
