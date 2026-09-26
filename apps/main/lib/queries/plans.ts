import { createAdminClient as createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types/admin";

/**
 * Lấy danh sách gói subscription.
 */
export async function getPlans(): Promise<Plan[]> {
  const supabase = await createClient();

  let { data, error } = await supabase
    .from("locketwan_plans")
    .select("*")
    .order("price", { ascending: true });

  if (error) {
    const fallback = await supabase
      .from("plans")
      .select("*")
      .order("price", { ascending: true });
    
    if (fallback.error) {
      console.error("Error fetching plans:", fallback.error);
      return [];
    }
    data = fallback.data;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name ?? row.id,
    description: row.description ?? "",
    price: row.price ?? 0,
    currency: row.currency ?? "VND",
    interval: row.interval ?? row.billing_cycle ?? "lifetime",
    features: row.features ?? [],
    is_active: row.is_active ?? row.active ?? true,
    subscriber_count: row.subscriber_count ?? 0,
  }));
}

/**
 * Lấy danh sách gói subscription khả dụng cho tạo đơn hàng (bảng locketwan_plans).
 */
export interface LocketPlanOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  billing_cycle: string;
  duration_days: number;
  active: boolean;
}

export async function getAvailableLocketPlans(): Promise<LocketPlanOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("locketwan_plans")
    .select("id, name, description, price, original_price, currency, billing_cycle, duration_days, active")
    .eq("active", true)
    .in("id", ["free", "lite", "pro"])
    .order("price", { ascending: true });

  if (!error && data && data.length > 0) {
    return data;
  }

  const fallback = await supabase
    .from("plans")
    .select("*")
    .in("id", ["free", "lite", "pro"]);
  if (fallback.data && fallback.data.length > 0) {
    return fallback.data.map((p) => ({
      id: p.id,
      name: p.name ?? p.id,
      description: p.description ?? null,
      price: Number(p.price ?? 0),
      original_price: Number(p.original_price ?? p.price ?? 0),
      currency: p.currency ?? "VND",
      billing_cycle: p.interval ?? "lifetime",
      duration_days: 365,
      active: true,
    }));
  }

  return [];
}
