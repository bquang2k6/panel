import type {
  ActivityLog,
  AppSettings,
  DashboardStats,
  MockOrder,
  OrderStats,
  Plan,
  RecentActivity,
  Report,
  User,
  UserStats,
} from "@/lib/types/admin";

export const mockUserStats: UserStats = {
  total: 1284,
  premium: 312,
  today: 18,
  todayActive: 15,
  banned: 7,
};

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Nguyen Van A",
    email: "nguyenvana@example.com",
    plan: "premium",
    status: "active",
    created_at: "2026-07-20T08:30:00Z",
  },
  {
    id: "2",
    name: "Tran Thi B",
    email: "tranthib@example.com",
    plan: "free",
    status: "active",
    created_at: "2026-07-22T14:15:00Z",
  },
  {
    id: "3",
    name: "Le Van C",
    email: "levanc@example.com",
    plan: "pro",
    status: "inactive",
    created_at: "2026-07-15T10:00:00Z",
  },
  {
    id: "4",
    name: "Pham Thi D",
    email: "phamthid@example.com",
    plan: "premium",
    status: "banned",
    created_at: "2026-06-28T16:45:00Z",
  },
  {
    id: "5",
    name: "Hoang Van E",
    email: "hoangvane@example.com",
    plan: "free",
    status: "active",
    created_at: "2026-07-26T09:20:00Z",
  },
];

export const mockOrderStats: OrderStats = {
  total: 456,
  revenue: 128_500_000,
  pending: 12,
  today: 8,
  todayCompleted: 5,
  todayPending: 3,
  todayRevenue: 0,
};

export const mockOrders: MockOrder[] = [
  {
    id: "1",
    order_code: "ORD-20260726-001",
    user_id: "1",
    user_name: "Nguyen Van A",
    user_email: "nguyenvana@example.com",
    plan: "Premium Monthly",
    amount: 99000,
    currency: "VND",
    status: "completed",
    payment_method: "MoMo",
    created_at: "2026-07-26T10:30:00Z",
  },
  {
    id: "2",
    order_code: "ORD-20260726-002",
    user_id: "5",
    user_name: "Hoang Van E",
    user_email: "hoangvane@example.com",
    plan: "Pro Yearly",
    amount: 990000,
    currency: "VND",
    status: "pending",
    payment_method: "Bank Transfer",
    created_at: "2026-07-26T11:45:00Z",
  },
  {
    id: "3",
    order_code: "ORD-20260725-003",
    user_id: "2",
    user_name: "Tran Thi B",
    user_email: "tranthib@example.com",
    plan: "Premium Monthly",
    amount: 99000,
    currency: "VND",
    status: "failed",
    payment_method: "VNPay",
    created_at: "2026-07-25T18:20:00Z",
  },
  {
    id: "4",
    order_code: "ORD-20260724-004",
    user_id: "3",
    user_name: "Le Van C",
    user_email: "levanc@example.com",
    plan: "Premium Monthly",
    amount: 99000,
    currency: "VND",
    status: "refunded",
    payment_method: "MoMo",
    created_at: "2026-07-24T09:10:00Z",
  },
];

export const mockDashboardStats: DashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalOrders: 0,
  revenue: 0,
  userGrowth: 0,
  orderGrowth: 0,
  todayUsers: 0,
  todayOrders: 0,
  todayCompletedOrders: 0,
  todayRevenue: 0,
};

export const mockRecentActivities: RecentActivity[] = [
  {
    id: "1",
    type: "user_signup",
    title: "New user registered",
    description: "Hoang Van E joined Locketwan",
    created_at: "2026-07-26T09:20:00Z",
  },
  {
    id: "2",
    type: "order",
    title: "Order completed",
    description: "ORD-20260726-001 — Premium Monthly (99,000 VND)",
    created_at: "2026-07-26T10:30:00Z",
  },
  {
    id: "3",
    type: "report",
    title: "New report submitted",
    description: "Inappropriate content report for user Pham Thi D",
    created_at: "2026-07-25T15:00:00Z",
  },
  {
    id: "4",
    type: "system",
    title: "System backup completed",
    description: "Daily database backup finished successfully",
    created_at: "2026-07-25T03:00:00Z",
  },
];

export const mockPlans: Plan[] = [
  {
    id: "1",
    name: "Free",
    description: "Basic features for casual users",
    price: 0,
    currency: "VND",
    interval: "month",
    features: ["5 locket photos", "Basic filters", "Standard support"],
    is_active: true,
    subscriber_count: 972,
  },
  {
    id: "2",
    name: "Premium",
    description: "Unlock premium features and more storage",
    price: 99000,
    currency: "VND",
    interval: "month",
    features: [
      "Unlimited locket photos",
      "Premium filters & themes",
      "Priority support",
      "No ads",
    ],
    is_active: true,
    subscriber_count: 256,
  },
  {
    id: "3",
    name: "Pro",
    description: "Full access for power users",
    price: 990000,
    currency: "VND",
    interval: "year",
    features: [
      "Everything in Premium",
      "Custom themes",
      "Analytics dashboard",
      "API access",
    ],
    is_active: true,
    subscriber_count: 56,
  },
];

export const mockReports: Report[] = [
  {
    id: "1",
    reporter_name: "User #892",
    reported_user: "Pham Thi D",
    reason: "Inappropriate content",
    status: "open",
    created_at: "2026-07-25T15:00:00Z",
  },
  {
    id: "2",
    reporter_name: "User #445",
    reported_user: "Unknown User",
    reason: "Spam messages",
    status: "resolved",
    created_at: "2026-07-24T11:30:00Z",
  },
  {
    id: "3",
    reporter_name: "User #120",
    reported_user: "Test Account",
    reason: "Fake profile",
    status: "dismissed",
    created_at: "2026-07-23T08:15:00Z",
  },
];

export const mockLogs: ActivityLog[] = [
  {
    id: "1",
    level: "info",
    action: "user.login",
    user: "admin@locketwan.com",
    details: "Admin logged in successfully",
    created_at: "2026-07-26T12:00:00Z",
  },
  {
    id: "2",
    level: "warn",
    action: "payment.retry",
    user: "tranthib@example.com",
    details: "Payment retry attempt #2 for order ORD-20260725-003",
    created_at: "2026-07-25T19:00:00Z",
  },
  {
    id: "3",
    level: "error",
    action: "upload.failed",
    user: "levanc@example.com",
    details: "File upload exceeded size limit (12MB)",
    created_at: "2026-07-25T14:30:00Z",
  },
  {
    id: "4",
    level: "info",
    action: "system.backup",
    details: "Daily backup completed in 45s",
    created_at: "2026-07-25T03:00:00Z",
  },
];

export const mockSettings: AppSettings = {
  site_name: "Locketwan",
  maintenance_mode: false,
  allow_registrations: true,
  max_upload_size_mb: 10,
  support_email: "support@locketwan.com",
  default_plan: "free",
};
