"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { sectionActions } from "@/features/datacenter/actions";
import type { OverlaySection, OverlaySectionPayload } from "@/features/datacenter/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: OverlaySection | null;
  onSuccess: (sec: OverlaySection, isEdit: boolean) => Promise<void> | void;
}

function buildDefault(): OverlaySectionPayload {
  return { id: "", name: "", order_id: 0, active: true, badge: "" };
}

export function SectionDialog({ open, onOpenChange, section, onSuccess }: SectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OverlaySectionPayload>(buildDefault());

  useEffect(() => {
    if (!open) return;
    if (section) {
      setForm({ id: section.id, name: section.name, order_id: section.order_id, active: section.active, badge: section.badge || "" });
    } else {
      setForm(buildDefault());
    }
    setError(null);
  }, [open, section]);

  function setField<K extends keyof OverlaySectionPayload>(key: K, val: OverlaySectionPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.id.trim()) { setError("ID section không được để trống."); return; }
    if (!form.name.trim()) { setError("Tên section không được để trống."); return; }

    try {
      setLoading(true);
      let savedSec: OverlaySection;
      const isEdit = !!section;
      if (section) {
        savedSec = await sectionActions.update(section.id, form);
      } else {
        savedSec = await sectionActions.create(form);
      }
      await onSuccess(savedSec, isEdit);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{section ? "Sửa Section" : "Tạo Section Mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                ID (slug) <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                placeholder="vd: overlay_holiday_captions"
                value={form.id}
                disabled={!!section}
                onChange={(e) => setField("id", e.target.value)}
              />
              {!section && (
                <p className="text-[10px] text-muted-foreground">Không thể thay đổi sau khi tạo.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Order</Label>
              <Input
                type="number"
                min={0}
                value={form.order_id}
                onChange={(e) => setField("order_id", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Tên hiển thị <span className="text-destructive">*</span>
            </Label>
            <Input
              required
              placeholder="vd: Holiday Captions"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Badge (emoji hoặc text ngắn)</Label>
            <Input
              placeholder="vd: 🎉 NEW"
              value={form.badge}
              onChange={(e) => setField("badge", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <Switch
              id="sec-active-sw"
              checked={form.active}
              onCheckedChange={(v) => setField("active", v)}
            />
            <Label htmlFor="sec-active-sw" className="text-xs cursor-pointer font-medium">Kích hoạt (active)</Label>
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={loading} className="bg-primary min-w-[90px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : section ? "Cập Nhật" : "Tạo Mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
