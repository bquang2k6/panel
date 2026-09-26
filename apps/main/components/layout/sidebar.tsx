"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  FileWarning,
  ScrollText,
  Settings,
  UsersRound,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Trash2,
  Package,
  HeartHandshake,
  CalendarDays,
  Bell,
  ChevronDown,
  Database,
  Palette,
  PlusCircle,
  ShieldCheck,
  Layers,
  Cloud,
} from "lucide-react";

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: {
    label: string;
    href: string;
    icon?: React.ElementType;
  }[];
}

const menuItems: MenuItem[] = [
  {
    href: "/admin",
    label: "Trang chủ",
    icon: Home,
  },
  {
    href: "/admin/dashboard",
    label: "Thống kê",
    icon: LayoutDashboard,
  },
  {
    label: "Đơn hàng",
    icon: ShoppingCart,
    children: [
      {
        href: "/admin/orders",
        label: "Tất cả đơn hàng",
        icon: Package,
      },
      {
        href: "/admin/orders/create",
        label: "Tạo đơn hàng mới",
        icon: PlusCircle,
      },
      {
        href: "/admin/orders?status=PENDING",
        label: "Chờ thanh toán",
        icon: Clock,
      },
      {
        href: "/admin/orders?status=PAID",
        label: "Đã thanh toán",
        icon: CheckCircle2,
      },
      {
        href: "/admin/orders?status=CANCELLED",
        label: "Đã hủy",
        icon: XCircle,
      },
    ],
  },
  {
    label: "Người dùng",
    icon: UsersRound,
    children: [
      {
        href: "/admin/users",
        label: "Tất cả người dùng",
        icon: UsersRound,
      },
      {
        href: "/admin/users?status=ACTIVE",
        label: "Đang hoạt động",
        icon: UserCheck,
      },
      {
        href: "/admin/users?status=INACTIVE",
        label: "Đã khóa",
        icon: UserX,
      },
      {
        href: "/admin/users?status=DELETED",
        label: "Đã xóa",
        icon: Trash2,
      },
      {
        href: "/admin/users/memberships",
        label: "Quản lý Membership",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "DataCenter",
    icon: Database,
    children: [
      {
        href: "/admin/data",
        label: "Activity Logs",
        icon: ScrollText,
      },
      {
        href: "/admin/data/connection",
        label: "Kết nối Database",
        icon: Database,
      },
      {
        href: "/admin/data/overlays",
        label: "Overlay Stuwan",
        icon: Palette,
      },
      {
        href: "/admin/data/donate",
        label: "Donate",
        icon: HeartHandshake,
      },
      {
        href: "/admin/data/timeline",
        label: "Timeline",
        icon: CalendarDays,
      },
      {
        href: "/admin/data/notification",
        label: "Thông báo",
        icon: Bell,
      },
    ],
  },
  {
    href: "/admin/plans",
    label: "Gói dịch vụ",
    icon: CreditCard,
  },
  {
    href: "/admin/cache",
    label: "Redis Cache",
    icon: Layers,
  },
  {
    href: "/admin/r2",
    label: "Cloudflare Analytics",
    icon: Cloud,
  },
  {
    href: "/admin/reports",
    label: "Báo cáo",
    icon: FileWarning,
  },
  {
    href: "/admin/logs",
    label: "Nhật ký",
    icon: ScrollText,
  },
  {
    href: "/admin/settings",
    label: "Cài đặt",
    icon: Settings,
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tự động mở các dropdown có chứa đường dẫn hiện tại
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    "Đơn hàng": pathname.startsWith("/admin/orders"),
    "Người dùng": pathname.startsWith("/admin/users"),
    "DataCenter": pathname.startsWith("/admin/data"),
  });

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Kiểm tra đường dẫn đang active
  const isLinkActive = (href: string) => {
    const currentQuery = searchParams.toString();

    // Link có query -> khớp tuyệt đối
    if (href.includes("?")) {
      return `${pathname}?${currentQuery}` === href;
    }

    // Link không query -> chỉ active khi URL hiện tại cũng không có query
    return pathname === href && !currentQuery;
  };

  return (
    <div className="flex h-full min-h-0 flex-col pt-2">
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        {menuItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const MainIcon = item.icon;
          const isOpen = openSubmenus[item.label] ?? false;

          // Kiểm tra xem bất kỳ child nào đang active không
          const isParentActive =
            hasChildren &&
            item.children?.some((child) => isLinkActive(child.href));

          if (hasChildren) {
            return (
              <div key={item.label} className="flex flex-col gap-1">
                {/* Button toggle dropdown menu */}
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.label)}
                  className={clsx(
                    "flex w-full rounded-md items-center justify-between px-3 py-3 text-sm font-medium transition-colors",
                    isParentActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "hover:bg-accent/60 text-foreground/80 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MainIcon className="h-4 w-4 shrink-0 text-primary" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    className={clsx(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {/* Submenu items */}
                {isOpen && (
                  <div className="ml-4 flex flex-col gap-1 border-l pl-1 my-0.5">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const active = isLinkActive(child.href);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onNavigate}
                          className={clsx(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-3 text-xs font-medium transition-colors",
                            active
                              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                          )}
                        >
                          {ChildIcon && (
                            <ChildIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                          )}
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Single menu item
          const active = item.href ? isLinkActive(item.href) : false;

          return (
            <Link
              key={item.href}
              href={item.href!}
              onClick={onNavigate}
              className={clsx(
                "flex items-center rounded-md gap-3 px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "hover:bg-accent hover:text-foreground text-foreground/80",
              )}
            >
              <MainIcon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {/* Footer Sidebar — System Info & Status */}
      <div className="border-t bg-background p-3">
        <div className="flex items-center justify-between rounded-lg bg-accent/50 p-2.5 border border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-foreground">Locketwan</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">v1.2.0 Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
