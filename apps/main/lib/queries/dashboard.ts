import { createAdminClient as createClient } from "@/lib/supabase/server";
import type { DashboardStats, RecentActivity } from "@/lib/types/admin";
import { mockDashboardStats, mockRecentActivities } from "@/lib/mock/admin-data";

/**
 * Lấy thống kê tổng quan cho dashboard bằng RPC function get_dashboard_stats.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_dashboard_stats");

    if (error || !data) {
      console.error("Lỗi khi truy vấn get_dashboard_stats RPC:", error);
      return mockDashboardStats;
    }

    return data as DashboardStats;
  } catch (error) {
    console.error("Lỗi khi truy vấn getDashboardStats:", error);
    return mockDashboardStats;
  }
}

/**
 * Lấy hoạt động gần đây từ View v_locketwan_orders làm recent activities.
 */
export async function getRecentActivities(
  limit = 10,
): Promise<RecentActivity[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("v_locketwan_orders")
      .select("id, status, price, created_at, plan_id, customer_code")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return mockRecentActivities;
    }

    return data.map((ord: any) => ({
      id: ord.id,
      type: "order",
      title: `Đơn hàng ${ord.id}`,
      description: `Khách hàng: ${ord.customer_code ?? "N/A"} — Giá: ${Number(ord.price ?? 0).toLocaleString("vi-VN")} VND (${ord.status})`,
      created_at: ord.created_at,
    }));
  } catch (error) {
    console.error("Lỗi khi lấy getRecentActivities:", error);
    return mockRecentActivities;
  }
}

// ─── Chart Data Types ────────────────────────────────────────────────────────

export type DailyRevenuePoint = {
  date: string;    // "DD/MM"
  revenue: number;
  orders: number;
};

export type DailyOrdersPoint = {
  date: string;    // "DD/MM"
  paid: number;
  pending: number;
  cancelled: number;
};

export type DailyUsersPoint = {
  date: string;    // "DD/MM"
  users: number;
};

export type OrderStatusPoint = {
  name: string;
  value: number;
  color: string;
};

// ─── Chart Queries ────────────────────────────────────────────────────────────

/**
 * Doanh thu (PAID) theo ngày trong N ngày gần nhất qua RPC get_revenue_chart_data.
 */
export async function getRevenueChartData(days = 30): Promise<DailyRevenuePoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_revenue_chart_data", { p_days: days });

    if (error) {
      console.error("get_revenue_chart_data RPC error:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      date: row.date,
      revenue: Number(row.revenue ?? 0),
      orders: Number(row.orders ?? 0),
    }));
  } catch (err) {
    console.error("getRevenueChartData error:", err);
    return [];
  }
}

/**
 * Số đơn theo trạng thái (PAID / PENDING / CANCELLED) theo ngày qua RPC get_orders_chart_data.
 */
export async function getOrdersChartData(days = 14): Promise<DailyOrdersPoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_orders_chart_data", { p_days: days });

    if (error) {
      console.error("get_orders_chart_data RPC error:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      date: row.date,
      paid: Number(row.paid ?? 0),
      pending: Number(row.pending ?? 0),
      cancelled: Number(row.cancelled ?? 0),
    }));
  } catch (err) {
    console.error("getOrdersChartData error:", err);
    return [];
  }
}

/**
 * User mới đăng ký theo ngày qua RPC get_users_chart_data.
 */
export async function getUsersChartData(days = 30): Promise<DailyUsersPoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_users_chart_data", { p_days: days });

    if (error) {
      console.error("get_users_chart_data RPC error:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      date: row.date,
      users: Number(row.users ?? 0),
    }));
  } catch (err) {
    console.error("getUsersChartData error:", err);
    return [];
  }
}

/**
 * Phân bổ trạng thái đơn hàng qua RPC get_order_status_distribution.
 */
export async function getOrderStatusDistribution(): Promise<OrderStatusPoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_order_status_distribution");

    if (error) {
      console.error("get_order_status_distribution RPC error:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      name: row.name,
      value: Number(row.value ?? 0),
      color: row.color,
    }));
  } catch (err) {
    console.error("getOrderStatusDistribution error:", err);
    return [];
  }
}

// ─── Monthly Chart Data Types ──────────────────────────────────────────────────

export type MonthlyRevenuePoint = {
  month: string;   // "MM/YYYY"
  revenue: number;
  orders: number;
};

export type MonthlyOrdersPoint = {
  month: string;   // "MM/YYYY"
  paid: number;
  pending: number;
  cancelled: number;
};

export type MonthlyUsersPoint = {
  month: string;   // "MM/YYYY"
  users: number;
};

// ─── Monthly Chart Queries ────────────────────────────────────────────────────

/**
 * Doanh thu (PAID) và số đơn theo tháng trong N tháng gần nhất qua RPC get_monthly_revenue_chart_data.
 */
export async function getMonthlyRevenueChartData(months = 12): Promise<MonthlyRevenuePoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_monthly_revenue_chart_data", { p_months: months });

    if (error) {
      console.error("get_monthly_revenue_chart_data RPC error:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      month: row.month,
      revenue: Number(row.revenue ?? 0),
      orders: Number(row.orders ?? 0),
    }));
  } catch (err) {
    console.error("getMonthlyRevenueChartData error:", err);
    return [];
  }
}

/**
 * Số đơn theo trạng thái theo tháng qua RPC get_monthly_orders_chart_data.
 */
export async function getMonthlyOrdersChartData(months = 12): Promise<MonthlyOrdersPoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_monthly_orders_chart_data", { p_months: months });

    if (error) {
      console.error("get_monthly_orders_chart_data RPC error:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      month: row.month,
      paid: Number(row.paid ?? 0),
      pending: Number(row.pending ?? 0),
      cancelled: Number(row.cancelled ?? 0),
    }));
  } catch (err) {
    console.error("getMonthlyOrdersChartData error:", err);
    return [];
  }
}

/**
 * User mới đăng ký theo tháng qua RPC get_monthly_users_chart_data.
 */
export async function getMonthlyUsersChartData(months = 12): Promise<MonthlyUsersPoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_monthly_users_chart_data", { p_months: months });

    if (error) {
      console.error("get_monthly_users_chart_data RPC error:", error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      month: row.month,
      users: Number(row.users ?? 0),
    }));
  } catch (err) {
    console.error("getMonthlyUsersChartData error:", err);
    return [];
  }
}


// ─── Current Month Daily Data ─────────────────────────────────────────────────

/**
 * Doanh thu theo ngày trong tháng hiện tại (mùng 1 → hôm nay, giờ VN).
 */
export async function getCurrentMonthRevenueDailyData(): Promise<MonthlyRevenuePoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_current_month_revenue_daily");

    if (error) {
      console.error("get_current_month_revenue_daily RPC error:", error);
      return [];
    }

    return (data ?? []).map((r: any) => ({
      month: r.date,
      revenue: Number(r.revenue ?? 0),
      orders: Number(r.orders ?? 0),
    }));
  } catch (err) {
    console.error("getCurrentMonthRevenueDailyData error:", err);
    return [];
  }
}

/**
 * Đơn hàng theo trạng thái từng ngày trong tháng hiện tại (mùng 1 → hôm nay, giờ VN).
 */
export async function getCurrentMonthOrdersDailyData(): Promise<MonthlyOrdersPoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_current_month_orders_daily");

    if (error) {
      console.error("get_current_month_orders_daily RPC error:", error);
      return [];
    }

    return (data ?? []).map((r: any) => ({
      month: r.date,
      paid: Number(r.paid ?? 0),
      pending: Number(r.pending ?? 0),
      cancelled: Number(r.cancelled ?? 0),
    }));
  } catch (err) {
    console.error("getCurrentMonthOrdersDailyData error:", err);
    return [];
  }
}

/**
 * User mới từng ngày trong tháng hiện tại (mùng 1 → hôm nay, giờ VN).
 */
export async function getCurrentMonthUsersDailyData(): Promise<MonthlyUsersPoint[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_current_month_users_daily");

    if (error) {
      console.error("get_current_month_users_daily RPC error:", error);
      return [];
    }

    return (data ?? []).map((r: any) => ({
      month: r.date,
      users: Number(r.users ?? 0),
    }));
  } catch (err) {
    console.error("getCurrentMonthUsersDailyData error:", err);
    return [];
  }
}

// ─── Daily Upload Stats Data ──────────────────────────────────────────────────

export type DailyUploadStats = {
  stat_date: string;
  total_users: number;
  total_images: number;
  total_videos: number;
  total_storage_mb: number;
  total_errors: number;
  error_details: Record<string, number>;
};

/**
 * Lấy thống kê upload hàng ngày theo date (YYYY-MM-DD) bằng RPC function get_daily_upload_stats.
 */
export async function getDailyUploadStats(statDate: string): Promise<DailyUploadStats> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_daily_upload_stats", {
      p_stat_date: statDate,
    });

    if (error || !data) {
      console.error("Lỗi khi truy vấn get_daily_upload_stats RPC:", error);
      return {
        stat_date: statDate,
        total_users: 0,
        total_images: 0,
        total_videos: 0,
        total_storage_mb: 0,
        total_errors: 0,
        error_details: {},
      };
    }

    return {
      stat_date: data.stat_date ?? statDate,
      total_users: Number(data.total_users ?? 0),
      total_images: Number(data.total_images ?? 0),
      total_videos: Number(data.total_videos ?? 0),
      total_storage_mb: Number(data.total_storage_mb ?? 0),
      total_errors: Number(data.total_errors ?? 0),
      error_details: data.error_details ?? {},
    };
  } catch (error) {
    console.error("Lỗi khi truy vấn getDailyUploadStats:", error);
    return {
      stat_date: statDate,
      total_users: 0,
      total_images: 0,
      total_videos: 0,
      total_storage_mb: 0,
      total_errors: 0,
      error_details: {},
    };
  }
}

