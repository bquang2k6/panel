import { createAdminClient as createClient } from "@/lib/supabase/server";
import type { Membership, MembershipStatus, OwnershipType } from "@/lib/types/membership";
import type { UserPlan } from "@/lib/types/user-plan";
import type { LocketPlanOption } from "@/lib/queries/plans";

export type MembershipStatusFilter = "ALL" | MembershipStatus;

export interface MembershipRow extends Membership {
  user_info?: Pick<UserPlan, "uid" | "username" | "display_name" | "email" | "customer_code" | "profile_picture"> | null;
  plan_info?: Pick<LocketPlanOption, "id" | "name" | "billing_cycle" | "price"> | null;
}

export interface GetMembershipsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: MembershipStatusFilter;
}

export interface GetMembershipsResult {
  data: MembershipRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Lấy danh sách membership từ View v_locketwan_memberships_detail
 */
export async function getMemberships(
  params: GetMembershipsParams = {}
): Promise<GetMembershipsResult> {
  const supabase = await createClient();
  const { page = 1, pageSize = 20, search = "", status = "ALL" } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("v_locketwan_memberships_detail")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "ALL") {
    query = query.eq("status", status);
  }

  if (search.trim()) {
    // search by uid or order_id
    query = query.or(`uid.eq.${search.trim()},order_id.eq.${search.trim()}`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("getMemberships error:", error);
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const rows: MembershipRow[] = (data ?? []).map((row: any) => ({
    id: row.id,
    uid: row.uid,
    plan_id: row.plan_id,
    status: row.status,
    ownership_type: row.ownership_type,
    start_at: row.start_at,
    purchase_date: row.purchase_date,
    expires_at: row.expires_at,
    payment_method: row.payment_method ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    order_id: row.order_id ?? null,
    user_info: row.user_info ?? null,
    plan_info: row.plan_info ?? null,
  }));

  const total = count ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return { data: rows, total, page, pageSize, totalPages };
}

/**
 * Lấy chi tiết một membership theo ID từ View v_locketwan_memberships_detail
 */
export async function getMembershipById(id: string): Promise<MembershipRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_locketwan_memberships_detail")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const row = data as any;
  return {
    id: row.id,
    uid: row.uid,
    plan_id: row.plan_id,
    status: row.status,
    ownership_type: row.ownership_type,
    start_at: row.start_at,
    purchase_date: row.purchase_date,
    expires_at: row.expires_at,
    payment_method: row.payment_method ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    order_id: row.order_id ?? null,
    user_info: row.user_info ?? null,
    plan_info: row.plan_info ?? null,
  };
}

/**
 * Cập nhật membership theo ID
 */
export async function updateMembership(
  id: string,
  updates: Partial<Pick<Membership, "status" | "ownership_type" | "start_at" | "expires_at" | "purchase_date" | "payment_method" | "order_id" | "plan_id">>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("locketwan_memberships")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Tạo membership mới
 */
export interface CreateMembershipPayload {
  uid: string;
  plan_id: string;
  status: MembershipStatus;
  ownership_type: OwnershipType;
  start_at: string;
  purchase_date: string;
  expires_at: string;
  payment_method?: string | null;
  order_id?: string | null;
}

export async function createMembership(
  payload: CreateMembershipPayload
): Promise<{ success: boolean; data?: MembershipRow; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locketwan_memberships")
    .insert([{
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as unknown as MembershipRow };
}
