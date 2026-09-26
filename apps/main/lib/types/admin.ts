export type UserStatus = "active" | "inactive" | "banned";
export type UserPlan = "free" | "premium" | "pro";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  plan: UserPlan;
  status: UserStatus;
  created_at: string;
}

export interface UserStats {
  total: number;
  premium: number;
  today: number;
  todayActive: number;
  banned: number;
}

export type MockOrderStatus = "pending" | "completed" | "failed" | "refunded";

export interface MockOrder {
  id: string;
  order_code?: string;
  user_id: string | null;
  user_name?: string;
  user_email?: string;
  plan?: string;
  plan_id?: string | null;
  amount?: number;
  currency?: string;
  price?: number | null;
  original_price?: number | null;
  billing_cycle?: string | null;
  status: MockOrderStatus;
  payment_method?: string;
  customer_code?: string | null;
  checkout_url?: string | null;
  checkout_qr?: string | null;
  transfer_content?: string | null;
  coupon_code?: string | null;
  bank_account_id?: string | null;
  transaction_id?: number | null;
  invoice_id?: string | null;
  invoice_sent?: boolean;

  created_at: string;
  updated_at?: string;
}
export interface OrderStats {
  total: number;
  revenue: number;
  pending: number;
  today: number;
  todayCompleted: number;
  todayPending: number;
  todayRevenue: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  revenue: number;
  userGrowth: number;
  orderGrowth: number;
  revenueGrowth?: number;
  todayUsers: number;
  todayOrders: number;
  todayCompletedOrders: number;
  todayRevenue: number;
}

export interface RecentActivity {
  id: string;
  type: "user_signup" | "order" | "report" | "system";
  title: string;
  description: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  is_active: boolean;
  subscriber_count: number;
}

export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter_name: string;
  reported_user: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

export type LogLevel = "info" | "warn" | "error";

export interface ActivityLog {
  id: string;
  level: LogLevel;
  action: string;
  user?: string;
  details: string;
  created_at: string;
}

export interface AppSettings {
  site_name: string;
  maintenance_mode: boolean;
  allow_registrations: boolean;
  max_upload_size_mb: number;
  support_email: string;
  default_plan: UserPlan;
}
