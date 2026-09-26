"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatusAction } from "@/app/admin/orders/actions";
import type { OrderStatus } from "@/lib/types/order";


const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "🕐 Chờ thanh toán" },
  { value: "PAID", label: "✅ Đã thanh toán" },
  { value: "FAILED", label: "❌ Thất bại" },
  { value: "CANCELLED", label: "🚫 Đã hủy" },
  { value: "EXPIRED", label: "⏰ Hết hạn" },
];

interface UpdateOrderStatusDialogProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function UpdateOrderStatusDialog({
  orderId,
  currentStatus,
}: UpdateOrderStatusDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<OrderStatus>(currentStatus);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, selected);
      if (result.success) {
        setMessage({ type: "success", text: "Cập nhật trạng thái thành công!" });
        setTimeout(() => {
          setOpen(false);
          setMessage(null);
        }, 1000);
      } else {
        setMessage({ type: "error", text: result.error ?? "Có lỗi xảy ra." });
      }
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="mr-1 h-3.5 w-3.5" />
        Đổi trạng thái
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p className="mb-3 text-sm text-muted-foreground">
              Mã đơn:{" "}
              <span className="font-mono font-semibold text-foreground">
                {orderId}
              </span>
            </p>
            <Select value={selected} onValueChange={(v) => setSelected(v as OrderStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {message && (
              <p
                className={`mt-3 rounded-md px-3 py-2 text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                }`}
              >
                {message.text}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isPending}>
                Hủy
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={isPending || selected === currentStatus}
            >
              {isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
