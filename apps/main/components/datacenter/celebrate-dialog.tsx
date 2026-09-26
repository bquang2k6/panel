"use client";

import { useEffect, useState } from "react";
import { celebrateActions } from "@/features/datacenter/actions";
import type { CelebrateItem, CelebratePayload } from "@/features/datacenter/types";
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

interface CelebrateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celebrate: CelebrateItem | null;
  onSuccess: () => Promise<void> | void;
}

const defaultForm: CelebratePayload = {
  uid: "",
  username: "",
  active: true,
  note: "",
  token: "",
  country_code: "VN",
};

export function CelebrateDialog({
  open,
  onOpenChange,
  celebrate,
  onSuccess,
}: CelebrateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CelebratePayload>(defaultForm);

  useEffect(() => {
    if (!open) return;
    if (celebrate) {
      setFormData({
        uid: celebrate.uid || "",
        username: celebrate.username || "",
        active: celebrate.active ?? true,
        note: celebrate.note || "",
        token: celebrate.token || "",
        country_code: celebrate.country_code || "VN",
      });
    } else {
      setFormData(defaultForm);
    }
  }, [open, celebrate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      if (celebrate) {
        await celebrateActions.update(celebrate.id, formData);
      } else {
        await celebrateActions.create(formData);
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
            {celebrate ? "Chỉnh Sửa Celebrate / Timeline" : "Tạo Bản Ghi Celebrate Mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Username</Label>
              <Input
                name="username"
                placeholder="Ví dụ: daovandoi"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">User ID (UID)</Label>
              <Input
                name="uid"
                placeholder="Ví dụ: usr_10293"
                value={formData.uid}
                onChange={(e) => setFormData((prev) => ({ ...prev, uid: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Token</Label>
              <Input
                name="token"
                placeholder="Ví dụ: tok_abc123"
                value={formData.token}
                onChange={(e) => setFormData((prev) => ({ ...prev, token: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Mã quốc gia (Country Code)</Label>
              <Input
                name="country_code"
                placeholder="VN, US..."
                value={formData.country_code}
                onChange={(e) => setFormData((prev) => ({ ...prev, country_code: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Ghi chú (Note)</Label>
            <Input
              name="note"
              placeholder="Nhập ghi chú cho bản ghi kỷ niệm..."
              value={formData.note}
              onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="active-checkbox"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, active: Boolean(checked) }))
              }
            />
            <Label htmlFor="active-checkbox" className="text-xs font-medium cursor-pointer">
              Kích hoạt bản ghi này (Active)
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary">
              {loading ? "Đang lưu..." : celebrate ? "Cập Nhật" : "Tạo Mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
