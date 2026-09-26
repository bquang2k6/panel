import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant =
  | "active"
  | "inactive"
  | "banned"
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "open"
  | "resolved"
  | "dismissed"
  | "info"
  | "warn"
  | "error"
  | "cancelled"
  // OrderStatus
  | "expired"
  // MembershipStatus
  | "replaced"
  | "suspended"
  // OwnershipType
  | "purchased"
  | "gift"
  | "trial";

const variantStyles: Record<StatusVariant, string> = {
  active:    "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  inactive:  "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
  banned:    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  pending:   "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  paid:      "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  failed:    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  refunded:  "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
  open:      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  resolved:  "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  dismissed: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
  info:      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  warn:      "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  error:     "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  cancelled: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
  // OrderStatus
  expired:   "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400",
  // MembershipStatus
  replaced:  "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
  suspended: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
  // OwnershipType
  purchased: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  gift:      "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-400",
  trial:     "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400",
};

const statusLabels: Record<StatusVariant, string> = {
  active:    "Active",
  inactive:  "Inactive",
  banned:    "Banned",
  pending:   "Pending",
  paid:      "Paid",
  failed:    "Failed",
  refunded:  "Refunded",
  open:      "Open",
  resolved:  "Resolved",
  dismissed: "Dismissed",
  info:      "Info",
  warn:      "Warning",
  error:     "Error",
  cancelled: "Cancelled",
  expired:   "Expired",
  replaced:  "Replaced",
  suspended: "Suspended",
  purchased: "Purchased",
  gift:      "Gift",
  trial:     "Trial",
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as keyof typeof statusLabels;
  return (
    <Badge variant="outline" className={cn("font-normal", variantStyles[normalizedStatus])}>
      {label ?? statusLabels[normalizedStatus]}
    </Badge>
  );
}
