"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateUserAction } from "@/app/admin/users/actions";
import type { UserPlan } from "@/lib/types/user-plan";

interface EditUserDialogProps {
  user: UserPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    email: "",
    phone: "",
    customer_code: "",
    is_active: true,
  });

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username ?? "",
        display_name: user.display_name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        customer_code: user.customer_code ?? "",
        is_active: user.is_active,
      });
      setMessage(null);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateUserAction(user.uid, {
        username: formData.username || null,
        display_name: formData.display_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        customer_code: formData.customer_code || null,
        is_active: formData.is_active,
      });

      if (result.success) {
        setMessage({ type: "success", text: "Cập nhật người dùng thành công!" });
        setTimeout(() => {
          onOpenChange(false);
          setMessage(null);
        }, 1000);
      } else {
        setMessage({ type: "error", text: result.error ?? "Có lỗi xảy ra." });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="text-xs font-mono text-muted-foreground bg-muted/40 p-2 rounded">
            UID: {user.uid}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="display_name">Tên hiển thị (Display Name)</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, display_name: e.target.value }))
              }
              placeholder="VD: Nguyễn Văn A"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="VD: nguyenvana"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="VD: user@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="VD: 0987654321"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer_code">Mã khách hàng (Customer Code)</Label>
            <Input
              id="customer_code"
              value={formData.customer_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customer_code: e.target.value }))
              }
              placeholder="VD: CUST-12345"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: Boolean(checked) }))
              }
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Tài khoản đang hoạt động (Active)
            </Label>
          </div>

          {message && (
            <p
              className={`rounded-md px-3 py-2 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
