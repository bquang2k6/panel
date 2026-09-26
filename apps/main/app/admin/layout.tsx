import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Suspense } from "react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Desktop sidebar — cố định full-height bên trái */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background">
        <Link
          href="/admin"
          className="flex h-16 shrink-0 items-center gap-3 border-b px-6"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold">Locketwan</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </Link>
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      </aside>

      {/* Vùng nội dung — lùi sang phải trên desktop */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Suspense fallback={<div className="h-16 border-b bg-background" />}>
          <Header />
        </Suspense>

        <main className="flex flex-1 flex-col">
          <div className="relative mx-auto w-full flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
