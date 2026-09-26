import { createAdminClient as createClient } from "@/lib/supabase/server";
import { unwrapRelation } from "@/lib/supabase/relation";
import type { Report } from "@/lib/types/admin";

/**
 * Lấy danh sách báo cáo vi phạm.
 */
export async function getReports(): Promise<Report[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      reason,
      status,
      created_at,
      reporter:reporter_id ( full_name ),
      reported:reported_user_id ( full_name )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    reporter_name:
      unwrapRelation(row.reporter)?.full_name ?? "Unknown",
    reported_user:
      unwrapRelation(row.reported)?.full_name ?? "Unknown",
    reason: row.reason,
    status: row.status,
    created_at: row.created_at,
  }));
}

/**
 * Cập nhật trạng thái báo cáo.
 */
export async function updateReportStatus(
  id: string,
  status: Report["status"],
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}
