"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format";
import type { UserPlan } from "@/lib/types/user-plan";

interface UserDetailDialogProps {
  user: UserPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-4 py-1 border-b border-muted/50 last:border-0">
      <span className="min-w-[140px] text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className={`text-sm ${mono ? "font-mono" : ""} break-all`}>
        {value ?? <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}

export function UserDetailDialog({
  user,
  open,
  onOpenChange,
}: UserDetailDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chi tiết người dùng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Header Avatar & Tên */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            {user.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profile_picture}
                alt="avatar"
                className="h-12 w-12 rounded-full object-cover border"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                {(user.display_name ?? user.username ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-base">
                {user.display_name ?? user.username ?? "Chưa đặt tên"}
              </p>
              <p className="text-xs text-muted-foreground">
                @{user.username ?? "no-username"}
              </p>
            </div>
          </div>

          <div className="flex flex-col">
            <InfoRow label="UID" value={user.uid} mono />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Số điện thoại" value={user.phone} />
            <InfoRow label="Mã khách hàng" value={user.customer_code} mono />
            <InfoRow label="Số lần gia hạn" value={user.renewal_count} />
            <InfoRow
              label="Trạng thái tài khoản"
              value={
                user.is_active ? (
                  <StatusBadge status="active" label="Đang hoạt động (Active)" />
                ) : (
                  <StatusBadge status="inactive" label="Bị khóa / Tắt (Inactive)" />
                )
              }
            />
            {user.deleted_at && (
              <InfoRow
                label="Đã xóa mềm"
                value={
                  <StatusBadge
                    status="banned"
                    label={`Đã xóa lúc ${formatDate(user.deleted_at)}`}
                  />
                }
              />
            )}
            <InfoRow
              label="Ngày tạo"
              value={formatDate(user.created_at)}
            />
            <InfoRow
              label="Cập nhật lần cuối"
              value={formatDate(user.updated_at)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
