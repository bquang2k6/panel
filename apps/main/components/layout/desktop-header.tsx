"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface DesktopHeaderProps {
  userNavContent?: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Trang chủ Admin",
  "/admin/dashboard": "Thống kê & Bảng điều khiển",
  "/admin/cache": "Quản lý User Cache",
  "/admin/orders": "Quản lý Đơn hàng",
  "/admin/orders/create": "Tạo đơn hàng mới",
  "/admin/users": "Quản lý Người dùng",
  "/admin/users/memberships": "Quản lý Membership",
  "/admin/settings": "Cài đặt Hệ thống",
  "/admin/plans": "Quản lý Gói dịch vụ",
  "/admin/reports": "Báo cáo Hệ thống",
  "/admin/logs": "Nhật ký Hoạt động",
  "/admin/data/overlays": "Overlay Stuwan",
  "/admin/data/donate": "Quản lý Donate",
  "/admin/data/timeline": "Quản lý Timeline",
  "/admin/data/notification": "Quản lý Thông báo",
  "/admin/r2": "Cloudflare Analytics Analytics",
};

export function DesktopHeader({ userNavContent }: DesktopHeaderProps) {
  const pathname = usePathname();

  // Lấy tiêu đề trang dựa trên URL hiện tại
  const currentTitle = PAGE_TITLES[pathname] || "Admin Panel";

  // Tạo đường dẫn breadcrumb
  const pathSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      let label = segment;
      if (segment === "admin") label = "Trang chủ";
      else if (segment === "dashboard") label = "Thống kê";
      else if (segment === "orders") label = "Đơn hàng";
      else if (segment === "users") label = "Người dùng";
      else if (segment === "settings") label = "Cài đặt";
      else if (segment === "plans") label = "Gói dịch vụ";
      else if (segment === "reports") label = "Báo cáo";
      else if (segment === "logs") label = "Nhật ký";
      else if (segment === "data") label = "DataCenter";
      else if (segment === "cache") label = "User Cache";
      else if (segment === "r2") label = "Zone Analytics";

      return {
        name: label.charAt(0).toUpperCase() + label.slice(1),
        href: `/admin${pathname.split(segment)[0]}${segment}`.replace(
          /\/+/g,
          "/"
        ),
      };
    });

  return (
    <div className="hidden w-full items-center justify-between px-8 lg:flex">
      {/* Desktop — Tiêu đề trang & Breadcrumb phía trên thanh Header */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col justify-center">
          <h1 className="text-base font-bold text-foreground tracking-tight leading-tight">
            {currentTitle}
          </h1>
          <nav aria-label="Breadcrumb" className="mt-0.5 flex items-center text-[11px] text-muted-foreground font-medium">
            <ol className="flex items-center gap-1">
              <li className="flex items-center">
                <Link
                  href="/admin"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <Home className="h-3 w-3 text-primary" />
                  <span>Admin</span>
                </Link>
              </li>

              {pathSegments.length > 1 &&
                pathSegments.slice(1).map((crumb, idx) => (
                  <li key={crumb.href} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                    {idx === pathSegments.slice(1).length - 1 ? (
                      <span className="font-semibold text-foreground/90">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="hover:text-foreground transition-colors"
                      >
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Desktop — Tiện ích & User Avatar Menu bên phải */}
      <div className="flex items-center gap-4">
        {/* Badge trạng thái hệ thống */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống hoạt động</span>
        </div>

        {/* Component Avatar Dropdown Menu */}
        {userNavContent}
      </div>
    </div>
  );
}
