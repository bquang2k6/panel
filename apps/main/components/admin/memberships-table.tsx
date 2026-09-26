"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
  Search,
  PlusCircle,
  Pencil,
  Ban,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  User as UserIcon,
  Loader2,
  ShieldCheck,
  Check,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MembershipRow } from "@/lib/queries/memberships";
import type { MembershipStatus, OwnershipType } from "@/lib/types/membership";
import type { LocketPlanOption } from "@/lib/queries/plans";
import {
  updateMembershipAction,
  createMembershipAction,
  expireMembershipAction,
  searchUsersForMembershipAction,
} from "@/app/admin/users/memberships/actions";

// ─── helpers ─────────────────────────────────────────────────────────────────

function toVNDatetimeLocal(isoStr: string): string {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return vn.toISOString().slice(0, 16);
}

function fromLocalToUTC(localStr: string): string {
  if (!localStr) return "";
  const d = new Date(localStr + ":00+07:00");
  return d.toISOString();
}

function formatDateVN(isoStr: string) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isExpiredSoon(expiresAt: string): boolean {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

const STATUS_LABELS: Record<MembershipStatus, string> = {
  ACTIVE: "Đang hoạt động",
  EXPIRED: "Hết hạn",
  REPLACED: "Đã thay thế",
  CANCELED: "Đã hủy",
  SUSPENDED: "Tạm dừng",
};

const STATUS_COLORS: Record<MembershipStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  EXPIRED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  REPLACED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  CANCELED: "bg-red-500/15 text-red-400 border-red-500/30",
  SUSPENDED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const OWNERSHIP_LABELS: Record<OwnershipType, string> = {
  PURCHASED: "Mua",
  GIFT: "Tặng",
  TRIAL: "Dùng thử",
};

const OWNERSHIP_COLORS: Record<OwnershipType, string> = {
  PURCHASED: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  GIFT: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  TRIAL: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};

function MembershipBadge({ status }: { status: MembershipStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {status === "ACTIVE" && <ShieldCheck className="h-3 w-3" />}
      {STATUS_LABELS[status]}
    </span>
  );
}

function OwnershipBadge({ type }: { type: OwnershipType }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${OWNERSHIP_COLORS[type]}`}
    >
      {type === "GIFT" && <Crown className="h-3 w-3" />}
      {OWNERSHIP_LABELS[type]}
    </span>
  );
}

// ─── UserSearchCombobox ───────────────────────────────────────────────────────

interface UserSearchResult {
  uid: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  customer_code: string | null;
  profile_picture: string | null;
}

function UserSearchCombobox({
  value,
  onSelect,
  disabled,
}: {
  value: UserSearchResult | null;
  onSelect: (u: UserSearchResult) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    const keyword = q.trim();

    if (keyword.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);

    try {
      const res = await searchUsersForMembershipAction(keyword);
      setResults(res);
      setOpen(res.length > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    doSearch(query);
  }, [doSearch, query]);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="UID, mã KH, username, email..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (value) onSelect(null as any);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            disabled={disabled}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          type="button"
          onClick={handleSearch}
          disabled={disabled || loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Tìm kiếm
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              onSelect(null as any);
              setQuery("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {value && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 text-white text-sm font-bold">
            {(value.display_name || value.username || "U")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {value.display_name || value.username || "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {value.email || value.uid}
            </p>
          </div>
          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
        </div>
      )}

      {open && !value && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          {results.map((u) => (
            <button
              key={u.uid}
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
              onClick={() => {
                onSelect(u);
                setOpen(false);
                setQuery(u.display_name || u.username || u.email || u.uid);
              }}
            >
              <div className="h-8 w-8 rounded-full bg-violet-600/80 flex items-center justify-center shrink-0 text-white text-sm font-bold">
                {(u.display_name || u.username || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {u.display_name || u.username || "—"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email} · {u.customer_code || u.uid.slice(0, 12) + "..."}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CreateMembershipDialog ───────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: LocketPlanOption[];
}

function CreateMembershipDialog({
  open,
  onOpenChange,
  plans,
}: CreateDialogProps) {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [status, setStatus] = useState<MembershipStatus>("ACTIVE");
  const [ownershipType, setOwnershipType] =
    useState<OwnershipType>("PURCHASED");
  const [startAt, setStartAt] = useState(
    toVNDatetimeLocal(new Date().toISOString()),
  );
  const [purchaseDate, setPurchaseDate] = useState(
    toVNDatetimeLocal(new Date().toISOString()),
  );
  const [expiresAt, setExpiresAt] = useState(() => {
    const plan = plans[0];
    const d = new Date();
    d.setDate(d.getDate() + (plan?.duration_days ?? 30));
    return toVNDatetimeLocal(d.toISOString());
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-update expiresAt when plan changes
  const handlePlanChange = (id: string) => {
    setPlanId(id);
    const plan = plans.find((p) => p.id === id);
    if (plan) {
      const d = new Date(fromLocalToUTC(startAt));
      d.setDate(d.getDate() + plan.duration_days);
      setExpiresAt(toVNDatetimeLocal(d.toISOString()));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!selectedUser) {
      setMessage({ type: "error", text: "Vui lòng chọn người dùng." });
      return;
    }
    if (!planId) {
      setMessage({ type: "error", text: "Vui lòng chọn gói." });
      return;
    }

    startTransition(async () => {
      const result = await createMembershipAction({
        uid: selectedUser.uid,
        plan_id: planId,
        status,
        ownership_type: ownershipType,
        start_at: fromLocalToUTC(startAt),
        purchase_date: fromLocalToUTC(purchaseDate),
        expires_at: fromLocalToUTC(expiresAt),
        payment_method: paymentMethod || null,
        order_id: orderId || null,
      });

      if (result.success) {
        setMessage({ type: "success", text: "Tạo membership thành công!" });
        setTimeout(() => {
          onOpenChange(false);
          setMessage(null);
        }, 900);
      } else {
        setMessage({ type: "error", text: result.error ?? "Có lỗi xảy ra." });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-violet-400" />
            Thêm Membership mới
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-1">
          {/* User */}
          <div className="space-y-1.5">
            <Label>
              Người dùng <span className="text-red-400">*</span>
            </Label>
            <UserSearchCombobox
              value={selectedUser}
              onSelect={setSelectedUser}
              disabled={isPending}
            />
          </div>

          {/* Plan */}
          <div className="space-y-1.5">
            <Label>
              Gói dịch vụ <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                    planId === plan.id
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-border hover:border-violet-500/40 hover:bg-muted/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan_id"
                    value={plan.id}
                    checked={planId === plan.id}
                    onChange={() => handlePlanChange(plan.id)}
                    className="sr-only"
                  />
                  <div
                    className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      planId === plan.id
                        ? "border-violet-500"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {planId === plan.id && (
                      <div className="h-2 w-2 rounded-full bg-violet-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{plan.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {plan.billing_cycle}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan.duration_days} ngày
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-violet-400">
                      {plan.price.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Status & Ownership */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-status">Trạng thái</Label>
              <select
                id="create-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as MembershipStatus)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {(
                  [
                    "ACTIVE",
                    "EXPIRED",
                    "REPLACED",
                    "CANCELED",
                    "SUSPENDED",
                  ] as MembershipStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-ownership">Loại sở hữu</Label>
              <select
                id="create-ownership"
                value={ownershipType}
                onChange={(e) =>
                  setOwnershipType(e.target.value as OwnershipType)
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {(["PURCHASED", "GIFT", "TRIAL"] as OwnershipType[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {OWNERSHIP_LABELS[t]}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-start">Ngày bắt đầu</Label>
              <Input
                id="create-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-purchase">Ngày mua</Label>
              <Input
                id="create-purchase"
                type="datetime-local"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="create-expires">Ngày hết hạn</Label>
              <Input
                id="create-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          {/* Extra */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-payment">Phương thức thanh toán</Label>
              <Input
                id="create-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="VD: banking, sepay..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-order">Mã đơn hàng (order_id)</Label>
              <Input
                id="create-order"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Để trống nếu không có"
              />
            </div>
          </div>

          {message && (
            <p
              className={`rounded-md px-3 py-2 text-sm ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
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
            <Button
              type="submit"
              disabled={isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tạo membership
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── EditMembershipDialog ─────────────────────────────────────────────────────

interface EditDialogProps {
  membership: MembershipRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: LocketPlanOption[];
}

function EditMembershipDialog({
  membership,
  open,
  onOpenChange,
  plans,
}: EditDialogProps) {
  const [form, setForm] = useState({
    plan_id: "",
    status: "ACTIVE" as MembershipStatus,
    ownership_type: "PURCHASED" as OwnershipType,
    start_at: "",
    purchase_date: "",
    expires_at: "",
    payment_method: "",
    order_id: "",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (membership) {
      setForm({
        plan_id: membership.plan_id,
        status: membership.status,
        ownership_type: membership.ownership_type,
        start_at: toVNDatetimeLocal(membership.start_at),
        purchase_date: toVNDatetimeLocal(membership.purchase_date),
        expires_at: toVNDatetimeLocal(membership.expires_at),
        payment_method: membership.payment_method ?? "",
        order_id: membership.order_id ?? "",
      });
      setMessage(null);
    }
  }, [membership]);

  if (!membership) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateMembershipAction(membership.id, {
        plan_id: form.plan_id,
        status: form.status,
        ownership_type: form.ownership_type,
        start_at: fromLocalToUTC(form.start_at),
        purchase_date: fromLocalToUTC(form.purchase_date),
        expires_at: fromLocalToUTC(form.expires_at),
        payment_method: form.payment_method || null,
        order_id: form.order_id || null,
      });

      if (result.success) {
        setMessage({ type: "success", text: "Cập nhật thành công!" });
        setTimeout(() => {
          onOpenChange(false);
          setMessage(null);
        }, 900);
      } else {
        setMessage({ type: "error", text: result.error ?? "Có lỗi xảy ra." });
      }
    });
  };

  const user = membership.user_info;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-400" />
            Chỉnh sửa Membership
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-1">
          {/* User info (read-only) */}
          {user && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <div className="h-9 w-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold shrink-0">
                {(user.display_name || user.username || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate text-sm">
                  {user.display_name || user.username || "—"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email} ·{" "}
                  {user.customer_code || user.uid.slice(0, 12) + "..."}
                </p>
              </div>
              <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          )}

          <div className="text-xs font-mono bg-muted/40 px-2 py-1.5 rounded text-muted-foreground">
            ID: {membership.id}
          </div>

          {/* Plan */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-plan">Gói dịch vụ</Label>
            <select
              id="edit-plan"
              value={form.plan_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, plan_id: e.target.value }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.price.toLocaleString("vi-VN")}₫ /{" "}
                  {p.billing_cycle}
                </option>
              ))}
            </select>
          </div>

          {/* Status & Ownership */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Trạng thái</Label>
              <select
                id="edit-status"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as MembershipStatus,
                  }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {(
                  [
                    "ACTIVE",
                    "EXPIRED",
                    "REPLACED",
                    "CANCELED",
                    "SUSPENDED",
                  ] as MembershipStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-ownership">Loại sở hữu</Label>
              <select
                id="edit-ownership"
                value={form.ownership_type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ownership_type: e.target.value as OwnershipType,
                  }))
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {(["PURCHASED", "GIFT", "TRIAL"] as OwnershipType[]).map(
                  (t) => (
                    <option key={t} value={t}>
                      {OWNERSHIP_LABELS[t]}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-start">Ngày bắt đầu</Label>
              <Input
                id="edit-start"
                type="datetime-local"
                value={form.start_at}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, start_at: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-purchase">Ngày mua</Label>
              <Input
                id="edit-purchase"
                type="datetime-local"
                value={form.purchase_date}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    purchase_date: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-expires">Ngày hết hạn</Label>
              <Input
                id="edit-expires"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, expires_at: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Extra */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-payment">Phương thức thanh toán</Label>
              <Input
                id="edit-payment"
                value={form.payment_method}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    payment_method: e.target.value,
                  }))
                }
                placeholder="VD: banking, sepay..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-order">Mã đơn hàng</Label>
              <Input
                id="edit-order"
                value={form.order_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, order_id: e.target.value }))
                }
                placeholder="order_id liên kết"
              />
            </div>
          </div>

          {message && (
            <p
              className={`rounded-md px-3 py-2 text-sm ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
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
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Table Component ─────────────────────────────────────────────────────

interface MembershipsTableProps {
  memberships: MembershipRow[];
  plans: LocketPlanOption[];
  page: number;
  totalPages: number;
  total: number;
  search: string;
  statusFilter: string;
}

export function MembershipsTable({
  memberships,
  plans,
  page,
  totalPages,
  total,
  search: initialSearch,
  statusFilter: initialStatus,
}: MembershipsTableProps) {
  const [editTarget, setEditTarget] = useState<MembershipRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [expiring, startExpireTransition] = useTransition();
  const [expireTarget, setExpireTarget] = useState<string | null>(null);

  const handleExpire = (id: string) => {
    setExpireTarget(id);
    startExpireTransition(async () => {
      await expireMembershipAction(id);
      setExpireTarget(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="search"
              className="pl-9"
              placeholder="Tìm theo UID, order_id..."
              defaultValue={initialSearch}
            />
          </div>
          <select
            name="status"
            defaultValue={initialStatus}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="EXPIRED">Hết hạn</option>
            <option value="REPLACED">Đã thay thế</option>
            <option value="CANCELED">Đã hủy</option>
            <option value="SUSPENDED">Tạm dừng</option>
          </select>
          <Button type="submit" size="sm" variant="secondary">
            Lọc
          </Button>
        </form>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white shrink-0 gap-1.5"
        >
          <PlusCircle className="h-4 w-4" />
          Thêm mới
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-muted-foreground whitespace-nowrap">Người dùng</TableHead>
              <TableHead className="text-muted-foreground whitespace-nowrap">Gói / Loại</TableHead>
              <TableHead className="text-muted-foreground whitespace-nowrap">Trạng thái</TableHead>
              <TableHead className="text-muted-foreground whitespace-nowrap">Bắt đầu</TableHead>
              <TableHead className="text-muted-foreground whitespace-nowrap">Hết hạn</TableHead>
              <TableHead className="text-muted-foreground whitespace-nowrap">Thanh toán</TableHead>
              <TableHead className="text-right text-muted-foreground whitespace-nowrap">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-16 text-center text-muted-foreground"
                >
                  Không có membership nào.
                </TableCell>
              </TableRow>
            ) : (
              memberships.map((m) => {
                const user = m.user_info;
                const plan = m.plan_info;
                const expiredSoon = isExpiredSoon(m.expires_at);
                const expired = isExpired(m.expires_at);

                return (
                  <TableRow key={m.id}>
                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-violet-600/80 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {(user?.display_name ||
                            user?.username ||
                            "U")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[140px]">
                            {user?.display_name || user?.username || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                            {user?.customer_code ||
                              m.uid.slice(0, 12) + "..."}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {plan?.name || m.plan_id}
                        </p>
                        <OwnershipBadge type={m.ownership_type} />
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <MembershipBadge status={m.status} />
                    </TableCell>

                    {/* Start */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {formatDateVN(m.start_at)}
                      </div>
                    </TableCell>

                    {/* Expires */}
                    <TableCell className="text-xs whitespace-nowrap">
                      <div
                        className={`flex items-center gap-1 ${
                          expired
                            ? "text-red-400"
                            : expiredSoon
                              ? "text-amber-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {formatDateVN(m.expires_at)}
                        {expiredSoon && !expired && (
                          <span className="ml-1 text-[10px] rounded bg-amber-500/20 text-amber-400 px-1">
                            Sắp hết
                          </span>
                        )}
                        {expired && m.status === "ACTIVE" && (
                          <span className="ml-1 text-[10px] rounded bg-red-500/20 text-red-400 px-1">
                            Quá hạn
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Payment */}
                    <TableCell className="text-xs text-muted-foreground">
                      {m.payment_method || "—"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditTarget(m);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {m.status === "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                            onClick={() => handleExpire(m.id)}
                            disabled={expiring && expireTarget === m.id}
                          >
                            {expiring && expireTarget === m.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Tổng{" "}
            <strong className="text-foreground">
              {total.toLocaleString("vi-VN")}
            </strong>{" "}
            membership
          </span>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <a
                href={`?page=${page - 1}&search=${initialSearch}&status=${initialStatus}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted/50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </a>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
            <span className="px-3 py-1 rounded-md border border-violet-500 bg-violet-500/10 text-violet-400 font-medium">
              {page}
            </span>
            <span className="text-muted-foreground/50">/</span>
            <span>{totalPages}</span>
            {page < totalPages ? (
              <a
                href={`?page=${page + 1}&search=${initialSearch}&status=${initialStatus}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted/50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </a>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border opacity-40">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <EditMembershipDialog
        membership={editTarget}
        open={editOpen}
        onOpenChange={setEditOpen}
        plans={plans}
      />
      <CreateMembershipDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        plans={plans}
      />
    </div>
  );
}
