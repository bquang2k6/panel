"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  cancelOrderAction,
  sendCompletionNotificationAction,
} from "@/app/admin/orders/actions";

interface OrderDetailActionsProps {
  orderId: string;
  status: string;
}

export function OrderDetailActions({ orderId, status }: OrderDetailActionsProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isCancelling, setIsCancelling] = useState(false);
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const isCancelled = status.toUpperCase() === "CANCELLED";

  // Action Hủy Đơn Hàng
  const handleCancelOrder = async () => {
    if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${orderId}?`)) return;

    setIsCancelling(true);
    try {
      const res = await cancelOrderAction(orderId);
      if (res.success) {
        toast({
          title: "Đã hủy đơn hàng!",
          description: `Đơn hàng ${orderId} đã được chuyển sang trạng thái HỦY (CANCELLED).`,
          variant: "destructive",
        });
        router.refresh();
      } else {
        toast({
          title: "Lỗi hủy đơn hàng",
          description: res.error || "Không thể hủy đơn hàng này.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Lỗi hệ thống",
        description: err.message || "Không thể hủy đơn hàng.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Action Bắn thông báo hoàn thành đơn
  const handleSendNotification = async () => {
    setIsSendingNotif(true);
    try {
      const res = await sendCompletionNotificationAction(orderId);
      if (res.success) {
        toast({
          title: "Đã gửi thông báo!",
          description: res.message || `Đã bắn thông báo hoàn thành cho đơn hàng ${orderId}`,
          variant: "success",
        });
        router.refresh();
      } else {
        toast({
          title: "Lỗi gửi thông báo",
          description: res.error || "Không thể gửi thông báo cho đơn hàng này.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Lỗi hệ thống",
        description: err.message || "Không thể bắn thông báo.",
        variant: "destructive",
      });
    } finally {
      setIsSendingNotif(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Nút Bắn thông báo hoàn thành */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSendNotification}
        disabled={isSendingNotif}
        className="border-primary/30 text-primary hover:bg-primary/10"
      >
        {isSendingNotif ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <Bell className="h-4 w-4 mr-1.5" />
        )}
        Bắn thông báo hoàn thành
      </Button>

      {/* Nút Hủy đơn hàng */}
      {!isCancelled && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancelOrder}
          disabled={isCancelling}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          {isCancelling ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <XCircle className="h-4 w-4 mr-1.5" />
          )}
          Hủy đơn hàng
        </Button>
      )}
    </div>
  );
}
