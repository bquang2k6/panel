import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  Coins,
  CheckCircle2,
  Clock,
  UserPlus,
} from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  getDashboardStats,
  getRecentActivities,
  getOrders,
  getRevenueChartData,
  getOrdersChartData,
  getUsersChartData,
  getOrderStatusDistribution,
  getCurrentMonthRevenueDailyData,
  getCurrentMonthOrdersDailyData,
  getCurrentMonthUsersDailyData,
  getDailyUploadStats,
} from "@/lib/queries";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { OrdersBarChart } from "@/components/charts/orders-bar-chart";
import { OrderStatusPie } from "@/components/charts/order-status-pie";
import { UsersLineChart } from "@/components/charts/users-line-chart";
import { MonthlyAnalyticsSection } from "@/components/admin/monthly-analytics-section";
import { DailyUploadStatsSection } from "@/components/admin/daily-upload-stats-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const dynamic = "force-dynamic";

type RecentOrder = {
  id: string;
  order_code: string;
  user_name: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
};

export default async function DashboardPage() {
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [
    dbStats,
    dbActivities,
    dbOrdersResult,
    revenueData,
    ordersData,
    usersData,
    statusData,
    initialMonthlyRevenue,
    initialMonthlyOrders,
    initialMonthlyUsers,
    initialDailyUploadStats,
  ] = await Promise.all([
    getDashboardStats().catch(() => null),
    getRecentActivities(8).catch(() => []),
    getOrders({ page: 1, pageSize: 5 }).catch(() => ({ data: [], total: 0, totalPages: 0 })),
    getRevenueChartData(30).catch(() => []),
    getOrdersChartData(14).catch(() => []),
    getUsersChartData(30).catch(() => []),
    getOrderStatusDistribution().catch(() => []),
    getCurrentMonthRevenueDailyData().catch(() => []),
    getCurrentMonthOrdersDailyData().catch(() => []),
    getCurrentMonthUsersDailyData().catch(() => []),
    getDailyUploadStats(todayStr).catch(() => ({
      stat_date: todayStr,
      total_users: 0,
      total_images: 0,
      total_videos: 0,
      total_storage_mb: 0,
      total_errors: 0,
      error_details: {},
    })),
  ]);

  const stats = dbStats ?? {
    totalUsers: 0, activeUsers: 0, totalOrders: 0, revenue: 0,
    userGrowth: 0, orderGrowth: 0, revenueGrowth: 0,
    todayRevenue: 0, todayCompletedOrders: 0, todayOrders: 0, todayUsers: 0,
  };
  const activities = dbActivities ?? [];
  const recentOrders: RecentOrder[] = (dbOrdersResult?.data ?? []).map((ord) => ({
    id: ord.id,
    order_code: ord.id,
    user_name: ord.user_info?.display_name ?? ord.user_info?.username ?? ord.customer_code ?? "—",
    plan: ord.plan_id ?? "—",
    amount: ord.price ?? 0,
    currency: "VND",
    status: (ord.status ?? "pending").toLowerCase(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Tổng quan hiệu suất ứng dụng và chỉ số giao dịch."
      />

      {/* Thống kê hôm nay */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          ⚡ Thống kê hôm nay (Giờ Việt Nam)
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Doanh thu hôm nay"
            value={formatCurrency(stats.todayRevenue)}
            icon={Coins}
          />
          <StatCard
            title="Đơn thành công hôm nay"
            value={stats.todayCompletedOrders.toLocaleString()}
            icon={CheckCircle2}
          />
          <StatCard
            title="Đơn tạo mới hôm nay"
            value={stats.todayOrders.toLocaleString()}
            icon={Clock}
          />
          <StatCard
            title="User mới hôm nay"
            value={stats.todayUsers.toLocaleString()}
            icon={UserPlus}
          />
        </div>
      </div>

      {/* Thống kê upload hàng ngày (3 ngày gần đây: Hôm nay, Hôm qua, Hôm kia) */}
      <DailyUploadStatsSection
        initialData={initialDailyUploadStats}
        initialDate={todayStr}
      />

      {/* Thống kê tổng quan */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          📊 Thống kê tổng tích lũy
        </h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            trend={stats.userGrowth}
            description="vs last 30 days"
          />
          <StatCard
            title="Hoạt động tháng này"
            value={stats.activeUsers.toLocaleString()}
            icon={TrendingUp}
          />
          <StatCard
            title="Đơn thành công tháng này"
            value={stats.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            trend={stats.orderGrowth}
            description="vs last month"
          />
          <StatCard
            title="Doanh thu tháng này"
            value={formatCurrency(stats.revenue)}
            trend={stats.revenueGrowth}
            description="vs last month"
            icon={DollarSign}
          />
        </div>
      </div>

      {/* ───────── CHARTS: HÀNG NGÀY ───────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          📈 Biểu đồ phân tích theo ngày
        </h2>

        {/* Row 1: Revenue Area + Orders Bar */}
        <div className="grid gap-4 lg:grid-cols-2 mb-4">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Doanh thu 30 ngày</CardTitle>
              <CardDescription>Doanh thu (PAID) và số đơn mỗi ngày theo giờ VN</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 min-w-0">
              <RevenueChart data={revenueData} />
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Đơn hàng 14 ngày</CardTitle>
              <CardDescription>Số đơn theo trạng thái mỗi ngày</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 min-w-0">
              <OrdersBarChart data={ordersData} />
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Users Line + Status Pie */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">User đăng ký mới 30 ngày</CardTitle>
              <CardDescription>Số user mới mỗi ngày, đường ngang là trung bình</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 min-w-0">
              <UsersLineChart data={usersData} />
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Phân bổ trạng thái đơn</CardTitle>
              <CardDescription>Tỉ lệ trạng thái tổng tất cả đơn hàng</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 min-w-0">
              <OrderStatusPie data={statusData} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ───────── CHARTS: HÀNG THÁNG ───────── */}
      <MonthlyAnalyticsSection
        initialRevenueData={initialMonthlyRevenue}
        initialOrdersData={initialMonthlyOrders}
        initialUsersData={initialMonthlyUsers}
        initialMonths={1}
      />


      {/* Recent orders + Activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2 min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Đơn hàng gần đây</CardTitle>
            <CardDescription>5 giao dịch mới nhất trên nền tảng</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <Table>
              <TableHeader>
                <TableRow className="text-muted-foreground">
                  <TableHead className="whitespace-nowrap">Mã đơn</TableHead>
                  <TableHead className="whitespace-nowrap">Khách hàng</TableHead>
                  <TableHead className="whitespace-nowrap">Gói</TableHead>
                  <TableHead className="whitespace-nowrap">Số tiền</TableHead>
                  <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Chưa có đơn hàng
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">
                          {order.order_code}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate whitespace-nowrap">{order.user_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{order.plan}</TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {formatCurrency(order.amount ?? 0, order.currency)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge status={order.status as Parameters<typeof StatusBadge>[0]["status"]} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Sự kiện mới nhất trên nền tảng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 min-w-0">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Chưa có hoạt động</p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="border-b pb-4 last:border-0 last:pb-0 min-w-0 break-words"
                  >
                    <p className="text-sm font-medium break-words">{activity.title}</p>
                    <p className="text-xs text-muted-foreground break-words mt-0.5">
                      {activity.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
