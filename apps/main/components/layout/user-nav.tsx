"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Check,
  ShieldCheck,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface UserNavProps {
  user?: {
    id: string;
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
      name?: string;
      role?: string;
    };
  } | null;
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const email = user?.email || "admin@locketwan.com";
  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    email.split("@")[0];
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Lấy 2 ký tự đầu tiên làm Avatar Fallback
  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "AD";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore errors
    } finally {
      router.push("/auth/login");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex items-center gap-2 rounded-full p-0.5 outline-none ring-offset-background transition-all"
        >
          <Avatar className="h-10 w-10 border-2 border-primary/20 transition-transform active:scale-95">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Green active dot indicator */}
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60 p-1.5" align="end" forceMount>
        {/* Header hiển thị thông tin người dùng */}
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-none text-foreground truncate">
                {fullName}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate leading-none">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Các liên kết điều hướng chính */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer py-2">
            <Link href="/admin/dashboard" className="flex items-center w-full">
              <LayoutDashboard className="mr-2.5 h-4 w-4 text-primary" />
              <span>Thống kê Dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer py-2">
            <Link
              href="/admin/permissions"
              className="flex items-center w-full"
            >
              <ShieldCheck className="mr-2.5 h-4 w-4 text-primary" />
              <span>Quản lý quyền truy cập</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer py-2">
            <Link href="/admin/settings" className="flex items-center w-full">
              <Settings className="mr-2.5 h-4 w-4 text-primary" />
              <span>Cài đặt hệ thống</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Cài đặt Giao diện */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="py-2">
            <div className="flex items-center">
              {theme === "dark" ? (
                <Moon className="mr-2.5 h-4 w-4 text-indigo-500" />
              ) : theme === "light" ? (
                <Sun className="mr-2.5 h-4 w-4 text-amber-500" />
              ) : (
                <Laptop className="mr-2.5 h-4 w-4 text-sky-500" />
              )}
              <span>Giao diện</span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center">
                  <Sun className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Sáng</span>
                </div>
                {theme === "light" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center">
                  <Moon className="mr-2 h-4 w-4 text-indigo-500" />
                  <span>Tối</span>
                </div>
                {theme === "dark" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center">
                  <Laptop className="mr-2 h-4 w-4 text-sky-500" />
                  <span>Hệ thống</span>
                </div>
                {theme === "system" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Nút Đăng xuất */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/50 py-2 font-medium"
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
