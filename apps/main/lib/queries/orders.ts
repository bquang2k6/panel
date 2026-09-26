import { createAdminClient as createClient } from "@/lib/supabase/server";
import type { OrderStats } from "@/lib/types/admin";
import { getStartOfDayVN } from "@/lib/format";
import { BankAccount } from "../types/bank-account";
import { UserPlan } from "../types/user-plan";
import { Membership } from "../types/membership";
import { Plan } from "../types/plan";
import { Order } from "../types/order";

export type OrderStatusFilter =
  | "ALL"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface OrderRow {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  price: number | null;
  original_price: number | null;
  billing_cycle: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  customer_code: string | null;
  checkout_url: string | null;
  transfer_content: string | null;
  checkout_qr: string | null;
  coupon_code: string | null;
  transaction_id: number | null;
  invoice_id: string | null;
  invoice_sent: boolean | null;
  bank_info: BankAccount | null;
  user_info: UserPlan | null;
}

export interface OrderFull {
  order_id: string;
  transaction_id: number | null;
  created_at: string;
  bank_info: BankAccount | null;
  order_info: Order;
  plan_info: Plan | null;
  membership_info: Membership | null;
  user_info: UserPlan | null;
}

export interface GetOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OrderStatusFilter;
}

export interface GetOrdersResult {
  data: OrderRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Danh sách orders với phân trang + tìm kiếm + lọc status
 */
export async function getOrders(
  params: GetOrdersParams = {}
): Promise<GetOrdersResult> {
  const supabase = await createClient();

  const { page = 1, pageSize = 20, search = "", status = "ALL" } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("v_locketwan_orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Lọc theo status
  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  // Tìm kiếm theo order id, customer_code, plan_id
  if (search.trim()) {
    const term = search.trim();
    query = query.or(
      `id.ilike.%${term}%,customer_code.ilike.%${term}%,plan_id.ilike.%${term}%`
    );
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: (data ?? []) as OrderRow[],
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Thống kê orders bằng RPC function get_order_stats
 */
export async function getOrderStats(): Promise<OrderStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_order_stats");

  if (error || !data) {
    console.error("Lỗi khi truy vấn get_order_stats RPC:", error);
    return {
      total: 0,
      revenue: 0,
      pending: 0,
      today: 0,
      todayCompleted: 0,
      todayPending: 0,
      todayRevenue: 0,
    };
  }

  return data as OrderStats;
}

/**
 * Chi tiết order (view đầy đủ)
 */
export async function getOrderById(id: string): Promise<OrderFull | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("v_locketwan_orderfull")
    .select("*")
    .eq("order_id", id)
    .single();

  if (error) return null;

  return data as OrderFull;
}

/**
 * Cập nhật trạng thái order
 */
export async function updateOrderStatus(
  id: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("locketwan_orders")
    .update({ status })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}