import { Suspense } from "react";
import { ShieldCheck, Activity, Clock, Ban, Crown } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { getMemberships } from "@/lib/queries";
import { getAvailableLocketPlans } from "@/lib/queries/plans";
import { createAdminClient } from "@/lib/supabase/server";
import type { MembershipStatusFilter } from "@/lib/queries/memberships";
import { MembershipsTable } from "@/components/admin/memberships-table";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

async function getMembershipStats() {
  const supabase = createAdminClient();

  const [totalRes, activeRes, expiredRes, suspendedRes] = await Promise.all([
    supabase.from("locketwan_memberships").select("*", { count: "exact", head: true }),
    supabase
      .from("locketwan_memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    supabase
      .from("locketwan_memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "EXPIRED"),
    supabase
      .from("locketwan_memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "SUSPENDED"),
  ]);

  // Sắp hết hạn trong 7 ngày
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringSoonRes = await supabase
    .from("locketwan_memberships")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE")
    .gte("expires_at", now.toISOString())
    .lte("expires_at", in7Days.toISOString());

  return {
    total: totalRes.count ?? 0,
    active: activeRes.count ?? 0,
    expired: expiredRes.count ?? 0,
    suspended: suspendedRes.count ?? 0,
    expiringSoon: expiringSoonRes.count ?? 0,
  };
}

export default async function MembershipsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const search = sp.search ?? "";
  const status = (sp.status ?? "ALL") as MembershipStatusFilter;

  const [result, plans, stats] = await Promise.all([
    getMemberships({ page, pageSize: 20, search, status }),
    getAvailableLocketPlans(),
    getMembershipStats(),
  ]);

  const { data: memberships, total, totalPages } = result;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Quản lý Membership"
        description="Xem, tạo và chỉnh sửa bản ghi membership của người dùng trong bảng locketwan_memberships."
      />

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Tổng membership"
          value={stats.total.toLocaleString("vi-VN")}
          icon={Crown}
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.active.toLocaleString("vi-VN")}
          icon={ShieldCheck}
        />
        <StatCard
          title="Sắp hết hạn (7 ngày)"
          value={stats.expiringSoon.toLocaleString("vi-VN")}
          icon={Clock}
        />
        <StatCard
          title="Đã hết hạn"
          value={stats.expired.toLocaleString("vi-VN")}
          icon={Activity}
        />
        <StatCard
          title="Tạm dừng"
          value={stats.suspended.toLocaleString("vi-VN")}
          icon={Ban}
        />
      </div>

      {/* Table */}
      <Suspense fallback={<div className="text-muted-foreground py-8 text-center">Đang tải...</div>}>
        <MembershipsTable
          memberships={memberships}
          plans={plans}
          page={page}
          totalPages={totalPages}
          total={total}
          search={search}
          statusFilter={status}
        />
      </Suspense>
    </div>
  );
}
