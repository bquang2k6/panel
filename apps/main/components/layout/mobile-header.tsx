"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, LayoutDashboard } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";

interface MobileHeaderProps {
  userNavContent?: React.ReactNode;
}

export function MobileHeader({ userNavContent }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Tự động đóng Sheet khi đường dẫn chuyển đổi
  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  return (
    <div className="flex w-full items-center justify-between px-4 lg:hidden">
      <div className="flex items-center gap-3">
        {/* Mobile — mở sidebar bằng sheet */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/80 bg-background hover:bg-accent transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Mở menu điều hướng"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72 p-0 gap-0">
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="flex items-center gap-2.5 text-base font-bold">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <span>Locketwan Admin</span>
              </SheetTitle>
            </SheetHeader>
            <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Đang tải menu...</div>}>
              <Sidebar onNavigate={() => setOpen(false)} />
            </Suspense>
          </SheetContent>
        </Sheet>

        {/* Mobile — logo & thương hiệu */}
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <LayoutDashboard className="h-4.5 w-4.5" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm tracking-tight text-foreground">
              Locketwan
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">
              Admin
            </p>
          </div>
        </Link>
      </div>

      {/* Mobile — Avatar Dropdown Menu / Auth button */}
      <div className="flex items-center gap-2">{userNavContent}</div>
    </div>
  );
}
