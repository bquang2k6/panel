import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  CreditCard,
  Building2,
  Receipt,
  Package,
  Crown,
} from "lucide-react";

import { getOrderById } from "@/lib/queries";
import type { OrderStatus } from "@/lib/types/order";
import { StatusBadge } from "@/components/admin/status-badge";
import { UpdateOrderStatusDialog } from "@/components/admin/update-order-status-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";

import { OrderDetailActions } from "@/components/admin/order-detail-actions";

interface Props {
  params: Promise<{ id: string }>;
}

// Helper: render một dòng thông tin
function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-4">
      <span className="min-w-[160px] text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className={`text-sm ${mono ? "font-mono" : ""} break-all`}>
        {value ?? <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  const { order_info, user_info, bank_info, plan_info, membership_info } = order;

  const status = order_info.status.toLowerCase() as Parameters<typeof StatusBadge>[0]["status"];

  return (
    <div className="flex flex-col gap-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/admin/orders"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách đơn hàng
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Đơn hàng{" "}
              <span className="font-mono text-primary">{order.order_id}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tạo lúc {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <UpdateOrderStatusDialog
              orderId={order.order_id}
              currentStatus={order_info.status}
            />
            <OrderDetailActions
              orderId={order.order_id}
              status={order_info.status}
            />
          </div>
        </div>
      </div>

      {/* Grid 2 cột */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Thông tin đơn hàng */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Thông tin đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <InfoRow label="Mã đơn hàng" value={order_info.id} mono />
            <InfoRow
              label="Trạng thái"
              value={<StatusBadge status={status} />}
            />
            <InfoRow
              label="Số tiền"
              value={
                order_info.price != null ? (
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    {formatCurrency(order_info.price, "VND")}
                  </span>
                ) : null
              }
            />
            {order_info.original_price != null &&
              order_info.original_price !== order_info.price && (
                <InfoRow
                  label="Giá gốc"
                  value={
                    <span className="line-through text-muted-foreground">
                      {formatCurrency(order_info.original_price, "VND")}
                    </span>
                  }
                />
              )}
            <InfoRow
              label="Chu kỳ thanh toán"
              value={order_info.billing_cycle}
            />
            {order_info.coupon_code && (
              <InfoRow
                label="Mã giảm giá"
                value={
                  <Badge variant="secondary">🎟 {order_info.coupon_code}</Badge>
                }
              />
            )}
            <InfoRow label="Mã KH" value={order_info.customer_code} mono />
            {order_info.transfer_content && (
              <InfoRow
                label="Nội dung CK"
                value={order_info.transfer_content}
                mono
              />
            )}
            {order_info.transaction_id && (
              <InfoRow
                label="Transaction ID"
                value={String(order_info.transaction_id)}
                mono
              />
            )}
            {order_info.invoice_id && (
              <InfoRow label="Invoice ID" value={order_info.invoice_id} mono />
            )}
            <InfoRow
              label="Invoice đã gửi"
              value={
                order_info.invoice_sent ? (
                  <span className="text-green-600">✓ Đã gửi</span>
                ) : (
                  <span className="text-muted-foreground">Chưa gửi</span>
                )
              }
            />
            <InfoRow label="Ngày tạo" value={formatDate(order.created_at)} />
            <InfoRow
              label="Cập nhật lần cuối"
              value={formatDate(order_info.updated_at)}
            />
          </CardContent>
        </Card>

        {/* Thông tin khách hàng */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-muted-foreground" />
              Thông tin khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {user_info ? (
              <>
                {/* Avatar */}
                <div className="flex items-center gap-3 pb-2 border-b">
                  {user_info.profile_picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user_info.profile_picture}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                      {(user_info.display_name ?? user_info.username ?? "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">
                      {user_info.display_name ?? user_info.username ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{user_info.username ?? "—"}
                    </p>
                  </div>
                </div>

                <InfoRow label="UID" value={user_info.uid} mono />
                <InfoRow label="Email" value={user_info.email} />
                <InfoRow label="Số điện thoại" value={user_info.phone} />
                <InfoRow label="Mã KH" value={user_info.customer_code} mono />
                <InfoRow
                  label="Số lần gia hạn"
                  value={user_info.renewal_count}
                />
                <InfoRow
                  label="Trạng thái tài khoản"
                  value={
                    user_info.is_active ? (
                      <StatusBadge status="active" />
                    ) : (
                      <StatusBadge status="inactive" />
                    )
                  }
                />
                <InfoRow
                  label="Ngày đăng ký"
                  value={formatDate(user_info.created_at)}
                />
                {user_info.deleted_at && (
                  <InfoRow
                    label="Ngày xóa"
                    value={formatDate(user_info.deleted_at)}
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không có thông tin khách hàng.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Thông tin ngân hàng */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Thông tin ngân hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {bank_info ? (
              <>
                <InfoRow
                  label="Ngân hàng"
                  value={bank_info.bank_fullname ?? bank_info.bank_name}
                />
                <InfoRow label="Tên ngắn" value={bank_info.bank_name} />
                <InfoRow label="BIN" value={bank_info.bin} mono />
                <InfoRow
                  label="Số tài khoản"
                  value={bank_info.account_number}
                  mono
                />
                <InfoRow
                  label="Chủ tài khoản"
                  value={bank_info.account_name}
                />
                <InfoRow
                  label="Trạng thái"
                  value={
                    bank_info.is_active ? (
                      <StatusBadge status="active" />
                    ) : (
                      <StatusBadge status="inactive" />
                    )
                  }
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không có thông tin ngân hàng.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gói và Membership */}
        <div className="flex flex-col gap-4">
          {/* Gói dịch vụ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-muted-foreground" />
                Thông tin gói dịch vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {plan_info ? (
                <>
                  <InfoRow label="Tên gói" value={plan_info.name} />
                  <InfoRow label="ID gói" value={plan_info.id} mono />
                  <InfoRow
                    label="Giá niêm yết"
                    value={formatCurrency(plan_info.price, "VND")}
                  />
                  {plan_info.original_price != null && (
                    <InfoRow
                      label="Giá gốc"
                      value={
                        <span className="line-through text-muted-foreground">
                          {formatCurrency(plan_info.original_price, "VND")}
                        </span>
                      }
                    />
                  )}
                  <InfoRow label="Chu kỳ" value={plan_info.billing_cycle} />
                  <InfoRow
                    label="Thời hạn"
                    value={`${plan_info.duration_days} ngày`}
                  />
                  <InfoRow
                    label="Số thành viên tối đa"
                    value={plan_info.max_members}
                  />
                  {plan_info.description && (
                    <InfoRow label="Mô tả" value={plan_info.description} />
                  )}
                  <InfoRow
                    label="Trạng thái gói"
                    value={
                      plan_info.active ? (
                        <StatusBadge status="active" />
                      ) : (
                        <StatusBadge status="inactive" />
                      )
                    }
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Không có thông tin gói.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Membership */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="h-4 w-4 text-muted-foreground" />
                Thông tin Membership
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {membership_info ? (
                <>
                  <InfoRow label="ID" value={membership_info.id} mono />
                  <InfoRow
                    label="Trạng thái"
                    value={
                      <StatusBadge
                        status={membership_info.status.toLowerCase() as Parameters<typeof StatusBadge>[0]["status"]}
                      />
                    }
                  />
                  <InfoRow
                    label="Loại sở hữu"
                    value={
                      <Badge variant="secondary">
                        {membership_info.ownership_type}
                      </Badge>
                    }
                  />
                  <InfoRow
                    label="Phương thức TT"
                    value={membership_info.payment_method}
                  />
                  <InfoRow
                    label="Ngày mua"
                    value={formatDate(membership_info.purchase_date)}
                  />
                  <InfoRow
                    label="Bắt đầu"
                    value={formatDate(membership_info.start_at)}
                  />
                  <InfoRow
                    label="Hết hạn"
                    value={formatDate(membership_info.expires_at)}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chưa có membership.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout URL & QR */}
      {(order_info.checkout_url || order_info.checkout_qr) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Thông tin thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {order_info.checkout_url && (
              <div className="flex-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Checkout URL
                </p>
                <a
                  href={order_info.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {order_info.checkout_url}
                </a>
              </div>
            )}
            {order_info.checkout_qr && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  QR Code
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order_info.checkout_qr}
                  alt="QR thanh toán"
                  className="h-40 w-40 rounded-lg border object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
