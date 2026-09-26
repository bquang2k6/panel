import { Suspense } from "react";
import { Users, UserCheck, UserX, Trash2, Clock, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { UsersToolbar } from "@/components/admin/users-toolbar";
import { UsersPagination } from "@/components/admin/users-pagination";
import { UserActionsDropdown } from "@/components/admin/user-actions-dropdown";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUsers, getUserStats } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import type { UserStatusFilter } from "@/lib/queries/users";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const search = sp.search ?? "";
  const status = (sp.status ?? "ALL") as UserStatusFilter;

  const [result, stats] = await Promise.all([
    getUsers({ page, pageSize: 20, search, status }),
    getUserStats(),
  ]);

  const { data: users, total, totalPages } = result;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Quản lý Người dùng"
        description="Danh sách tài khoản từ bảng user_plans. Hỗ trợ sửa, khóa/mở khóa tài khoản và xóa mềm."
      />

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Mới hôm nay"
          value={stats.today.toLocaleString("vi-VN")}
          icon={UserPlus}
        />
        <StatCard
          title="Active mới hôm nay"
          value={stats.todayActive.toLocaleString("vi-VN")}
          icon={UserCheck}
        />
        <StatCard
          title="Tổng tài khoản"
          value={stats.total.toLocaleString("vi-VN")}
          icon={Users}
        />
        <StatCard
          title="Đang hoạt động"
          value={stats.active.toLocaleString("vi-VN")}
          icon={UserCheck}
        />
        <StatCard
          title="Bị khóa / Inactive"
          value={stats.inactive.toLocaleString("vi-VN")}
          icon={UserX}
        />
        <StatCard
          title="Đã xóa mềm"
          value={stats.deleted.toLocaleString("vi-VN")}
          icon={Trash2}
        />
      </div>

      {/* Toolbar — search and status filter */}
      <Suspense fallback={null}>
        <UsersToolbar />
      </Suspense>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="whitespace-nowrap">Người dùng</TableHead>
              <TableHead className="whitespace-nowrap">Liên hệ (Email / SĐT)</TableHead>
              <TableHead className="whitespace-nowrap">Mã KH (Customer Code)</TableHead>
              <TableHead className="whitespace-nowrap">Số lần gia hạn</TableHead>
              <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
              <TableHead className="whitespace-nowrap">Ngày tạo</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-16 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-10 w-10 opacity-20" />
                    <p>Không tìm thấy người dùng nào.</p>
                    {(search || status !== "ALL") && (
                      <p className="text-xs text-muted-foreground">
                        Thử thay đổi từ khóa hoặc bộ lọc.
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.uid}>
                  {/* Người dùng (Avatar + Display Name + Username) */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.profile_picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.profile_picture}
                          alt="avatar"
                          className="h-9 w-9 rounded-full object-cover shrink-0 border"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {(user.display_name ?? user.username ?? "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium leading-snug">
                          {user.display_name ?? user.username ?? "Chưa đặt tên"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          @{user.username ?? user.uid.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Email / SĐT */}
                  <TableCell>
                    <div>
                      <p className="text-xs">{user.email ?? "—"}</p>
                      {user.phone && (
                        <p className="text-xs text-muted-foreground font-mono">
                          📞 {user.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Mã KH */}
                  <TableCell>
                    {user.customer_code ? (
                      <span className="font-mono text-xs font-medium bg-muted/50 px-2 py-0.5 rounded border">
                        {user.customer_code}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Gia hạn */}
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {user.renewal_count} lần
                    </Badge>
                  </TableCell>

                  {/* Trạng thái */}
                  <TableCell>
                    {user.deleted_at ? (
                      <StatusBadge status="banned" label="Đã xóa mềm" />
                    ) : user.is_active ? (
                      <StatusBadge status="active" label="Active" />
                    ) : (
                      <StatusBadge status="inactive" label="Inactive / Khóa" />
                    )}
                  </TableCell>

                  {/* Ngày tạo */}
                  <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                    {formatDate(user.created_at)}
                  </TableCell>

                  {/* Action dropdown */}
                  <TableCell>
                    <UserActionsDropdown user={user} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-t">
          <Suspense fallback={null}>
            <UsersPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={20}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
