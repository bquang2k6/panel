"use client";

import { useEffect, useState } from "react";
import { notificationActions } from "@/features/datacenter/actions";
import type { NotificationItem, NotificationPayload } from "@/features/datacenter/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notification: NotificationItem | null;
  onSuccess: () => Promise<void> | void;
}

const defaultForm: NotificationPayload = {
  title: "",
  message: "",
  pinned: false,
};

export function NotificationDialog({
  open,
  onOpenChange,
  notification,
  onSuccess,
}: NotificationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NotificationPayload>(defaultForm);

  useEffect(() => {
    if (!open) return;
    if (notification) {
      setFormData({
        title: notification.title || "",
        message: notification.message || "",
        pinned: notification.pinned || false,
      });
    } else {
      setFormData(defaultForm);
    }
  }, [open, notification]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      if (notification) {
        await notificationActions.update(notification.id, formData);
      } else {
        await notificationActions.create(formData);
      }
      await onSuccess();
      onOpenChange(false);
      setFormData(defaultForm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {notification ? "Chỉnh Sửa Thông Báo" : "Tạo Thông Báo Mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Tiêu đề thông báo</Label>
            <Input
              name="title"
              placeholder="Nhập tiêu đề (Không bắt buộc)..."
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Nội dung thông báo <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              name="message"
              placeholder="Nhập nội dung tin nhắn thông báo..."
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="pinned-checkbox"
              checked={formData.pinned}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, pinned: Boolean(checked) }))
              }
            />
            <Label htmlFor="pinned-checkbox" className="text-xs font-medium cursor-pointer">
              Ghim thông báo này lên đầu (Pinned)
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary">
              {loading ? "Đang lưu..." : notification ? "Cập Nhật" : "Tạo Mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
