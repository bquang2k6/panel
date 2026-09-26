import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { UserPlan } from "@/lib/types/user-plan";
import { getStartOfDayVN } from "@/lib/format";

export type UserStatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "DELETED";

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: UserStatusFilter;
}

export interface GetUsersResult {
  data: UserPlan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserPlanStats {
  total: number;
  active: number;
  inactive: number;
  deleted: number;
  today: number;
  todayActive: number;
}

/**
 * Lấy danh sách users từ bảng user_plans
 */
export async function getUsers(
  params: GetUsersParams = {}
): Promise<GetUsersResult> {
  const supabase = createAdminClient();

  const { page = 1, pageSize = 20, search = "", status = "ALL" } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("user_plans")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Filter theo trạng thái
  if (status === "ACTIVE") {
    query = query.eq("is_active", true).is("deleted_at", null);
  } else if (status === "INACTIVE") {
    query = query.eq("is_active", false).is("deleted_at", null);
  } else if (status === "DELETED") {
    query = query.not("deleted_at", "is", null);
  } else {
    // Mặc định ALL: chỉ lấy chưa bị xóa mềm trừ khi chọn filter DELETED
    query = query.is("deleted_at", null);
  }

  // Tìm kiếm
  if (search.trim()) {
    const term = search.trim();
    query = query.or(
      `uid.ilike.%${term}%,username.ilike.%${term}%,display_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,customer_code.ilike.%${term}%`
    );
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: (data ?? []) as UserPlan[],
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Thống kê user_plans bằng RPC function get_user_stats
 */
export async function getUserStats(): Promise<UserPlanStats> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("get_user_stats");

    if (error || !data) {
      console.error("Lỗi khi truy vấn get_user_stats RPC:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        deleted: 0,
        today: 0,
        todayActive: 0,
      };
    }

    return data as UserPlanStats;
  } catch (error) {
    console.error("Lỗi khi lấy getUserStats:", error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      deleted: 0,
      today: 0,
      todayActive: 0,
    };
  }
}

/**
 * Lấy chi tiết user theo UID
 */
export async function getUserByUid(uid: string): Promise<UserPlan | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_plans")
    .select("*")
    .eq("uid", uid)
    .single();

  if (error) return null;

  return data as UserPlan;
}

/**
 * Cập nhật thông tin user
 */
export async function updateUser(
  uid: string,
  updates: Partial<Pick<UserPlan, "username" | "display_name" | "email" | "phone" | "customer_code" | "is_active">>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("user_plans")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("uid", uid);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Ban / Unban user (Thay đổi trạng thái is_active)
 */
export async function toggleUserActive(
  uid: string,
  is_active: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("user_plans")
    .update({
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("uid", uid);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Xóa mềm user (Soft delete: set deleted_at = now())
 */
export async function softDeleteUser(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("user_plans")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("uid", uid);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Khôi phục user đã xóa mềm
 */
export async function restoreUser(
  uid: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("user_plans")
    .update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("uid", uid);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
