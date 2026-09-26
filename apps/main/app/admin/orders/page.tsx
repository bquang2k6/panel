import { Suspense } from "react";
import {
  Download,
  ShoppingCart,
  Clock,
  CheckCircle2,
  TrendingUp,
  Coins,
  Hourglass,
} from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { OrdersToolbar } from "@/components/admin/orders-toolbar";
import { OrdersPagination } from "@/components/admin/orders-pagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders, getOrderStats } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types/order";
import type { OrderStatusFilter } from "@/lib/queries/orders";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const search = sp.search ?? "";
  const status = (sp.status ?? "ALL") as OrderStatusFilter;

  const [result, stats] = await Promise.all([
    getOrders({ page, pageSize: 20, search, status }),
    getOrderStats(),
  ]);

  const { data: orders, total, totalPages } = result;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Đơn hàng"
        description="Theo dõi và quản lý tất cả giao dịch thanh toán."
      >
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Xuất CSV
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats.todayRevenue, "VND")}
          icon={Coins}
        />
        <StatCard
          title="Đơn thành công hôm nay"
          value={stats.todayCompleted.toLocaleString("vi-VN")}
          icon={CheckCircle2}
        />
        <StatCard
          title="Đơn tạo hôm nay"
          value={stats.today.toLocaleString("vi-VN")}
          icon={Clock}
        />
        <StatCard
          title="Chờ thanh toán"
          value={stats.pending.toLocaleString("vi-VN")}
          icon={Hourglass}
        />
        <StatCard
          title="Tổng doanh thu"
          value={formatCurrency(stats.revenue, "VND")}
          icon={TrendingUp}
        />
        <StatCard
          title="Tổng đơn hàng"
          value={stats.total.toLocaleString("vi-VN")}
          icon={ShoppingCart}
        />
      </div>

      {/* Toolbar — client component */}
      <Suspense fallback={null}>
        <OrdersToolbar />
      </Suspense>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="whitespace-nowrap">Mã đơn hàng</TableHead>
              <TableHead className="whitespace-nowrap">Khách hàng</TableHead>
              <TableHead className="whitespace-nowrap">Gói / Chu kỳ</TableHead>
              <TableHead className="whitespace-nowrap">Số tiền</TableHead>
              <TableHead className="whitespace-nowrap">Ngân hàng</TableHead>
              <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
              <TableHead className="whitespace-nowrap">Ngày tạo</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-16 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-10 w-10 opacity-20" />
                    <p>Không tìm thấy đơn hàng nào.</p>
                    {(search || status !== "ALL") && (
                      <p className="text-xs">Thử thay đổi bộ lọc.</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  {/* Mã đơn */}
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs font-medium text-primary hover:underline"
                    >
                      {order.id}
                    </Link>
                    {order.coupon_code && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        🎟 {order.coupon_code}
                      </p>
                    )}
                  </TableCell>

                  {/* Khách hàng */}
                  <TableCell>
                    <div>
                      <p className="font-medium leading-snug">
                        {order.user_info?.display_name ??
                          order.user_info?.username ??
                          order.customer_code ??
                          "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.user_info?.uid ?? order.user_id ?? "—"}
                      </p>
                    </div>
                  </TableCell>

                  {/* Gói */}
                  <TableCell>
                    <p className="font-medium">{order.plan_id ?? "—"}</p>
                    {order.billing_cycle && (
                      <p className="text-xs text-muted-foreground capitalize">
                        {order.billing_cycle}
                      </p>
                    )}
                  </TableCell>

                  {/* Số tiền */}
                  <TableCell>
                    <p className="font-semibold whitespace-nowrap">
                      {order.price != null
                        ? formatCurrency(order.price, "VND")
                        : "—"}
                    </p>
                    {order.original_price != null &&
                      order.original_price !== order.price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatCurrency(order.original_price, "VND")}
                        </p>
                      )}
                  </TableCell>

                  {/* Ngân hàng */}
                  <TableCell>
                    {order.bank_info ? (
                      <div>
                        <p className="font-medium text-xs">
                          {order.bank_info.bank_name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {order.bank_info.account_number}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Trạng thái */}
                  <TableCell>
                    <StatusBadge
                      status={
                        (
                          order.status as OrderStatus
                        ).toLowerCase() as Parameters<
                          typeof StatusBadge
                        >[0]["status"]
                      }
                    />
                  </TableCell>

                  {/* Ngày tạo */}
                  <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                    {formatDate(order.created_at)}
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs text-primary hover:underline whitespace-nowrap"
                    >
                      Chi tiết →
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-t">
          <Suspense fallback={null}>
            <OrdersPagination
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
