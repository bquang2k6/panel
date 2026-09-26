import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  ShoppingCart,
  UsersRound,
  CreditCard,
} from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardStats, getRecentActivities } from "@/lib/queries";
import { formatCurrency, formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const quickLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    description: "View analytics & overview",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Manage registered users",
    icon: UsersRound,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "Track payments & orders",
    icon: ShoppingCart,
  },
  {
    href: "/admin/plans",
    label: "Plans",
    description: "Manage subscription plans",
    icon: CreditCard,
  },
];

const activityIcons: Record<string, string> = {
  user_signup: "👤",
  order: "💳",
  report: "⚠️",
  system: "⚙️",
};

export default async function AdminHomePage() {
  const [dbStats, dbActivities] = await Promise.all([
    getDashboardStats().catch(() => null),
    getRecentActivities(5).catch(() => []),
  ]);

  const stats = dbStats ?? {
    totalUsers: 0, activeUsers: 0, totalOrders: 0, revenue: 0,
    userGrowth: 0, orderGrowth: 0, revenueGrowth: 0,
    todayRevenue: 0, todayCompletedOrders: 0, todayOrders: 0, todayUsers: 0,
  };
  const activities = dbActivities ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Welcome to Locketwan Admin"
        description="Manage your platform from one central dashboard."
      />

      {/* Quick stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-5">
        <StatCard title="Doanh thu hôm nay" value={formatCurrency(stats.todayRevenue)} />
        <StatCard title="Đơn thành công hôm nay" value={stats.todayCompletedOrders.toLocaleString()} />
        <StatCard title="User mới hôm nay" value={stats.todayUsers.toLocaleString()} />
        <StatCard title="Tổng doanh thu" value={formatCurrency(stats.revenue)} />
        <StatCard title="Tổng đơn hàng" value={stats.totalOrders.toLocaleString()} />
        <StatCard title="Tổng người dùng" value={stats.totalUsers.toLocaleString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Jump to frequently used sections</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickLinks.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events on your platform</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/logs">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <span className="mt-0.5 text-lg">
                    {activityIcons[activity.type] ?? "📌"}
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
