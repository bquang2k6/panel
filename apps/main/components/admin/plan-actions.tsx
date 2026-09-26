"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlanAction, updatePlanAction, deletePlanAction } from "@/app/admin/plans/actions";
import type { Plan } from "@/lib/types/admin";

export function CreatePlanButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    price: 0,
    currency: "VND",
    billing_cycle: "lifetime",
    duration_days: 0,
    active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createPlanAction(form);
      setOpen(false);
      setForm({ id: "", name: "", description: "", price: 0, currency: "VND", billing_cycle: "lifetime", duration_days: 0, active: true });
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Gói Mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Mã Gói (ID)</Label>
              <Input required value={form.id} onChange={e => setForm({...form, id: e.target.value})} placeholder="VD: pro" />
            </div>
            <div className="space-y-2">
              <Label>Tên Gói</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Locket Pro" />
            </div>
            <div className="space-y-2">
              <Label>Mô Tả</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá Tiền</Label>
                <Input type="number" required value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Chu Kỳ (VD: lifetime)</Label>
                <Input required value={form.billing_cycle} onChange={e => setForm({...form, billing_cycle: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Hủy</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PlanActions({ plan }: { plan: Plan }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: plan.name,
    description: plan.description,
    price: plan.price,
    billing_cycle: plan.interval,
    active: plan.is_active,
  });

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updatePlanAction(plan.id, form);
      setEditOpen(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deletePlanAction(plan.id);
      setDeleteOpen(false);
    });
  };

  return (
    <>
      <Button variant="outline" className="flex-1" onClick={() => setEditOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" /> Edit
      </Button>
      <Button variant="ghost" className="text-destructive" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="mr-2 h-4 w-4" /> Delete
      </Button>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa Gói: {plan.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên Gói</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Mô Tả</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá Tiền</Label>
                <Input type="number" required value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Chu Kỳ (VD: lifetime, month)</Label>
                <Input required value={form.billing_cycle} onChange={e => setForm({...form, billing_cycle: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id={`active-${plan.id}`} checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} />
              <Label htmlFor={`active-${plan.id}`}>Đang Hoạt Động (Active)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isPending}>Hủy</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cập Nhật
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa Gói Dịch Vụ</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa gói <strong>{plan.name}</strong> không? Hành động này không thể hoàn tác.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa Ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
