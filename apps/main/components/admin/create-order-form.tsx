"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  PlusCircle,
  Loader2,
  Sparkles,
  CreditCard,
  QrCode,
  ArrowRight,
  AlertTriangle,
  XCircle,
  Bell,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import {
  searchUsersAction,
  createOrderAction,
  checkPendingOrderAction,
  cancelOrderAction,
  sendCompletionNotificationAction,
} from "@/app/admin/orders/actions";
import type { UserPlan } from "@/lib/types/user-plan";
import type { LocketPlanOption } from "@/lib/queries/plans";

interface CreateOrderFormProps {
  plans: LocketPlanOption[];
}

export function CreateOrderForm({ plans }: CreateOrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Step 1: User search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserPlan[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPlan | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Check existing pending order
  const [existingPendingOrder, setExistingPendingOrder] = useState<any | null>(null);
  const [isCheckingPending, setIsCheckingPending] = useState(false);
  const [isCancellingPending, setIsCancellingPending] = useState(false);

  // Step 2: Plan & Options state
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id ?? "");
  const [couponCode, setCouponCode] = useState("");
  const [isCustomPrice, setIsCustomPrice] = useState(false);
  const [customPriceInput, setCustomPriceInput] = useState<string>("");
  const [initialStatus, setInitialStatus] = useState<string>("PENDING");

  // Step 3: Submission & Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdOrderData, setCreatedOrderData] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Selected plan details
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0];

  const finalCalculatedPrice = isCustomPrice
    ? Math.max(0, parseInt(customPriceInput || "0", 10))
    : (selectedPlan?.price ?? 0);

  // Handle Select User & Check Existing Pending Order
  const handleSelectUser = async (user: UserPlan) => {
    setSelectedUser(user);
    setExistingPendingOrder(null);
    setIsCheckingPending(true);

    try {
      const res = await checkPendingOrderAction(user.uid);
      if (res.hasPending && res.order) {
        setExistingPendingOrder(res.order);
        toast({
          title: "Thông báo đơn hàng chưa thanh toán",
          description: `Khách hàng ${user.display_name || user.username} đang có đơn hàng chờ thanh toán: ${res.order.id}`,
        });
      }
    } catch (err) {
      console.error("Lỗi kiểm tra đơn chưa thanh toán:", err);
    } finally {
      setIsCheckingPending(false);
    }
  };

  // Handle Search Users
  const handleSearchUsers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setErrorMsg(null);
    setHasSearched(true);
    setExistingPendingOrder(null);

    try {
      const results = await searchUsersAction(q);
      setSearchResults(results);
      if (results.length === 1) {
        await handleSelectUser(results[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi tìm kiếm người dùng");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Cancel Existing Pending Order
  const handleCancelExistingPendingOrder = async () => {
    if (!existingPendingOrder) return;
    setIsCancellingPending(true);

    try {
      const res = await cancelOrderAction(existingPendingOrder.id);
      if (res.success) {
        toast({
          title: "Đã hủy đơn hàng thành công!",
          description: `Đã hủy đơn hàng cũ ${existingPendingOrder.id}. Bạn có thể tạo đơn hàng mới ngay bây giờ.`,
          variant: "success",
        });
        setExistingPendingOrder(null);
      } else {
        toast({
          title: "Lỗi hủy đơn hàng",
          description: res.error || "Không thể hủy đơn hàng cũ.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Lỗi hệ thống",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsCancellingPending(false);
    }
  };

  // Handle Create Order Submit
  const handleCreateOrder = async () => {
    if (!selectedUser) {
      setErrorMsg("Vui lòng chọn người dùng trước khi tạo đơn hàng");
      return;
    }
    if (!selectedPlanId) {
      setErrorMsg("Vui lòng chọn gói dịch vụ");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createOrderAction({
        userId: selectedUser.uid,
        planId: selectedPlanId,
        coupon: couponCode.trim() || undefined,
        customPrice: isCustomPrice ? finalCalculatedPrice : undefined,
        status: initialStatus,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Tạo đơn hàng thất bại");
        toast({
          title: "Tạo đơn hàng thất bại",
          description: res.error || "Có lỗi xảy ra khi tạo đơn hàng",
          variant: "destructive",
        });
      } else {
        setCreatedOrderData(res.data);
        toast({
          title: "Tạo đơn hàng thành công!",
          description: `Đơn hàng ${res.data?.orderId || res.data?.id || ""} đã được khởi tạo thành công.`,
          variant: "success",
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi không xác định");
      toast({
        title: "Lỗi hệ thống",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel Created Order
  const handleCancelCreatedOrder = async () => {
    const orderId = createdOrderData?.orderId || createdOrderData?.id;
    if (!orderId) return;
    if (!confirm(`Bạn có chắc muốn hủy đơn hàng ${orderId}?`)) return;

    setIsActionLoading(true);
    try {
      const res = await cancelOrderAction(orderId);
      if (res.success) {
        toast({
          title: "Đã hủy đơn hàng!",
          description: `Đơn hàng ${orderId} đã chuyển trạng thái HỦY.`,
          variant: "destructive",
        });
        setCreatedOrderData((prev: any) => ({ ...prev, status: "CANCELLED" }));
      } else {
        toast({ title: "Lỗi hủy đơn", description: res.error, variant: "destructive" });
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Send Completion Notification
  const handleSendNotification = async () => {
    const orderId = createdOrderData?.orderId || createdOrderData?.id;
    if (!orderId) return;

    setIsActionLoading(true);
    try {
      const res = await sendCompletionNotificationAction(orderId);
      if (res.success) {
        toast({
          title: "Đã gửi thông báo!",
          description: res.message || `Đã bắn thông báo hoàn thành cho đơn hàng ${orderId}`,
          variant: "success",
        });
      } else {
        toast({ title: "Lỗi gửi thông báo", description: res.error, variant: "destructive" });
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({ title: "Đã sao chép!", description: text, variant: "success" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setExistingPendingOrder(null);
    setCouponCode("");
    setIsCustomPrice(false);
    setCustomPriceInput("");
    setCreatedOrderData(null);
    setErrorMsg(null);
  };

  // ---------------------------------------------------------------------------
  // SUCCESS VIEW AFTER ORDER CREATION
  // ---------------------------------------------------------------------------
  if (createdOrderData) {
    const orderId = createdOrderData.orderId || createdOrderData.id;
    const transferContent = createdOrderData.transfer_content || `${orderId} ${createdOrderData.customer_code || ""}`;
    const qrUrl = createdOrderData.checkout_qr;
    const currentOrderStatus = (createdOrderData.status || initialStatus).toUpperCase();

    return (
      <Card className="border-green-200 bg-green-50/20 dark:border-green-900/50 dark:bg-green-950/10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl text-green-700 dark:text-green-400 mt-2">
            Đơn hàng đã tạo thành công!
          </CardTitle>
          <CardDescription>
            Đơn hàng đã được lưu hệ thống và cấp QR chuyển khoản.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border bg-background p-4">
            <div>
              <p className="text-xs text-muted-foreground">Mã đơn hàng</p>
              <div className="flex items-center gap-1.5 mt-0.5 font-mono font-semibold text-primary">
                <span>{orderId}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(orderId, "orderId")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedKey === "orderId" ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Số tiền thanh toán</p>
              <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                {formatCurrency(createdOrderData.price ?? finalCalculatedPrice)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Gói dịch vụ</p>
              <p className="font-medium text-sm mt-0.5">{selectedPlan?.name ?? createdOrderData.plan_id}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Trạng thái</p>
              <div className="mt-1">
                <StatusBadge
                  status={currentOrderStatus.toLowerCase() as any}
                />
              </div>
            </div>
          </div>

          {/* Transfer & QR Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border bg-background p-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Thông tin chuyển khoản
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Khách hàng: </span>
                  <span className="font-medium">{selectedUser?.display_name || selectedUser?.username}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mã KH: </span>
                  <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded">{createdOrderData.customer_code || selectedUser?.customer_code}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nội dung chuyển khoản: </span>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded border font-mono font-bold text-primary">
                    <span className="truncate">{transferContent}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transferContent, "transfer")}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {copiedKey === "transfer" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {qrUrl && (
              <div className="flex flex-col items-center justify-center rounded-xl border bg-background p-4 text-center">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-primary" /> Mã QR Thanh toán (SePay)
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="QR Code thanh toan"
                  className="h-40 w-40 object-contain rounded border bg-white p-1"
                />
              </div>
            )}
          </div>

          {/* Additional Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
            <div className="flex flex-wrap items-center gap-2">
              {/* Nút Bắn thông báo hoàn thành */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendNotification}
                disabled={isActionLoading}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                {isActionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Bell className="h-4 w-4 mr-1.5" />
                )}
                Bắn thông báo hoàn thành
              </Button>

              {/* Nút Hủy đơn hàng */}
              {currentOrderStatus !== "CANCELLED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelCreatedOrder}
                  disabled={isActionLoading}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Hủy đơn hàng
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                <PlusCircle className="h-4 w-4 mr-1.5" /> Tạo đơn hàng khác
              </Button>
              <Button size="sm" asChild>
                <Link href={`/admin/orders/${orderId}`}>
                  Xem chi tiết đơn <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // FORM VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column: Form Steps */}
      <div className="lg:col-span-2 space-y-6">

        {/* STEP 1: Search & Select User */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">1</span>
              Tìm kiếm & Chọn Khách hàng
            </CardTitle>
            <CardDescription>
              Nhập UID, Mã khách hàng (MBSLK...), Username hoặc Email để chọn người dùng nhận gói.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearchUsers} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Nhập UID, customer_code, username hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Tìm kiếm
              </Button>
            </form>

            {/* Selected User Info */}
            {selectedUser ? (
              <div className="space-y-3">
                <div className="rounded-xl border bg-primary/5 p-4 border-primary/20 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {(selectedUser.display_name || selectedUser.username || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {selectedUser.display_name || selectedUser.username || "Người dùng"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          @{selectedUser.username || selectedUser.uid.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null);
                        setExistingPendingOrder(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Đổi khách hàng
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-primary/10">
                    <div>
                      <span className="text-muted-foreground">UID: </span>
                      <span className="font-mono font-medium">{selectedUser.uid}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mã KH: </span>
                      <span className="font-mono font-bold text-primary">
                        {selectedUser.customer_code || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email: </span>
                      <span>{selectedUser.email || "Chưa cập nhật"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trạng thái: </span>
                      <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                        {selectedUser.is_active ? "Hoạt động" : "Khóa"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Warning: Existing Pending Order Alert */}
                {isCheckingPending ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang kiểm tra đơn hàng chờ của khách hàng...
                  </div>
                ) : existingPendingOrder ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20 p-4 space-y-3 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold text-sm">
                          Cảnh báo: Khách hàng đã có đơn hàng chưa thanh toán!
                        </p>
                        <p>
                          Mã đơn: <span className="font-mono font-bold">{existingPendingOrder.id}</span> — Số tiền: <span className="font-bold">{formatCurrency(existingPendingOrder.price ?? 0)}</span> ({existingPendingOrder.plan_id})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200 dark:border-amber-900/50">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8 text-xs border-amber-400 bg-white hover:bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                      >
                        <Link href={`/admin/orders/${existingPendingOrder.id}`} target="_blank">
                          Chuyển tới đơn hiện tại <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelExistingPendingOrder}
                        disabled={isCancellingPending}
                        className="h-8 text-xs border-red-300 text-red-700 bg-white hover:bg-red-50 dark:bg-red-950 dark:text-red-300"
                      >
                        {isCancellingPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        Hủy đơn hiện tại & Tạo đơn mới
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : hasSearched ? (
              searchResults.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Không tìm thấy người dùng phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Kết quả tìm kiếm ({searchResults.length}):
                  </p>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {searchResults.map((u) => (
                      <div
                        key={u.uid}
                        onClick={() => handleSelectUser(u)}
                        className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-xs">
                            {(u.display_name || u.username || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-xs">
                              {u.display_name || u.username}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              UID: {u.uid.slice(0, 12)}... | Mã KH: {u.customer_code || "N/A"}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Chọn
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : null}
          </CardContent>
        </Card>

        {/* STEP 2: Select Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">2</span>
              Chọn Gói dịch vụ
            </CardTitle>
            <CardDescription>
              Chọn gói đăng ký áp dụng cho đơn hàng này từ danh sách `locketwan_plans`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Không tìm thấy gói dịch vụ nào active trong hệ thống.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((p) => {
                  const isSelected = p.id === selectedPlanId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                          : "hover:border-primary/50"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{p.name}</p>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {p.id}
                          </Badge>
                        </div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {p.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground capitalize">
                          {p.billing_cycle || "vĩnh viễn"}
                        </span>
                        <div className="text-right">
                          {p.original_price && p.original_price > p.price && (
                            <span className="text-xs text-muted-foreground line-through mr-1.5">
                              {formatCurrency(p.original_price)}
                            </span>
                          )}
                          <span className="font-bold text-sm text-primary">
                            {formatCurrency(p.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* STEP 3: Options & Price */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">3</span>
              Tùy chỉnh đơn hàng & Trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Coupon Code */}
              <div className="space-y-2">
                <Label htmlFor="coupon" className="text-xs">Mã giảm giá (Coupon)</Label>
                <Input
                  id="coupon"
                  placeholder="Ví dụ: DISCOUNT20..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="uppercase font-mono text-sm"
                />
              </div>

              {/* Initial Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs">Trạng thái khởi tạo đơn hàng</Label>
                <select
                  id="status"
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="PENDING">Chờ thanh toán (PENDING)</option>
                  <option value="PAID">Đã thanh toán (PAID - Hoàn tất ngay)</option>
                </select>
              </div>
            </div>

            {/* Custom Price Toggle */}
            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="customPriceCheck"
                  checked={isCustomPrice}
                  onChange={(e) => setIsCustomPrice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="customPriceCheck" className="text-xs font-medium cursor-pointer">
                  Tùy chỉnh giá thủ công (ghi đè giá gói mặc định)
                </Label>
              </div>

              {isCustomPrice && (
                <div className="max-w-xs space-y-1">
                  <Label htmlFor="customPriceInput" className="text-xs text-muted-foreground">
                    Nhập số tiền đơn hàng (VND)
                  </Label>
                  <Input
                    id="customPriceInput"
                    type="number"
                    placeholder="Ví dụ: 99000"
                    value={customPriceInput}
                    onChange={(e) => setCustomPriceInput(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Order Summary Sidebar */}
      <div className="space-y-6">
        <Card className="sticky top-20 border-primary/20 shadow-md">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Tóm tắt đơn hàng
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* User */}
            <div className="space-y-1 pb-3 border-b">
              <span className="text-xs text-muted-foreground">Khách hàng:</span>
              {selectedUser ? (
                <div>
                  <p className="font-semibold text-sm">
                    {selectedUser.display_name || selectedUser.username}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Mã KH: {selectedUser.customer_code || selectedUser.uid.slice(0, 8)}
                  </p>
                </div>
              ) : (
                <p className="text-xs italic text-amber-600 dark:text-amber-400">
                  Chưa chọn khách hàng
                </p>
              )}
            </div>

            {/* Plan */}
            <div className="space-y-1 pb-3 border-b">
              <span className="text-xs text-muted-foreground">Gói dịch vụ:</span>
              <p className="font-semibold text-sm">
                {selectedPlan?.name || "Chưa chọn gói"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                Chu kỳ: {selectedPlan?.billing_cycle || "vĩnh viễn"}
              </p>
            </div>

            {/* Coupon */}
            {couponCode && (
              <div className="flex items-center justify-between text-xs pb-3 border-b">
                <span className="text-muted-foreground">Mã giảm giá:</span>
                <Badge variant="outline" className="font-mono text-primary border-primary/30">
                  🎟 {couponCode}
                </Badge>
              </div>
            )}

            {/* Price Total */}
            <div className="pt-2 flex items-baseline justify-between">
              <span className="font-medium text-sm">Tổng tiền:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(finalCalculatedPrice)}
              </span>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleCreateOrder}
              disabled={isSubmitting || !selectedUser || !selectedPlanId || (existingPendingOrder && !isCancellingPending)}
              className="w-full h-11 text-sm font-semibold shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang tạo đơn hàng...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" /> XÁC NHẬN TẠO ĐƠN HÀNG
                </>
              )}
            </Button>

            {existingPendingOrder && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                Vui lòng chuyển tới hoặc hủy đơn hàng cũ của khách hàng trước khi tạo đơn mới.
              </p>
            )}

            <p className="text-[11px] text-center text-muted-foreground">
              Đơn hàng sẽ được tạo qua Edge Function `orders` hoặc lưu trực tiếp vào bảng `locketwan_orders`.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
