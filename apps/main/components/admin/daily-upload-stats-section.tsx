"use client";

import { useState, useTransition, useMemo } from "react";
import {
  HardDrive,
  Users,
  Image as ImageIcon,
  Video,
  AlertTriangle,
  Loader2,
  Calendar,
  Database,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DailyUploadStats } from "@/lib/queries";
import { getDailyUploadStatsAction } from "@/app/admin/dashboard/actions";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DailyUploadStatsSectionProps {
  initialData: DailyUploadStats;
  initialDate?: string;
}

/**
 * Hàm lấy 3 ngày gần nhất (Hôm nay, Hôm qua, Hôm kia) theo múi giờ Việt Nam
 * Trả về danh sách option với value dạng "2026-08-31"
 */
function getRecent3DateOptions() {
  const now = new Date();

  const getVNFormattedDate = (d: Date) => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  };

  const todayStr = getVNFormattedDate(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getVNFormattedDate(yesterday);

  const dayBeforeYesterday = new Date(now);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  const dayBeforeYesterdayStr = getVNFormattedDate(dayBeforeYesterday);

  return [
    { value: todayStr, label: `Hiện tại / Hôm nay (${todayStr})` },
    { value: yesterdayStr, label: `Hôm qua (${yesterdayStr})` },
    {
      value: dayBeforeYesterdayStr,
      label: `Hôm kia (${dayBeforeYesterdayStr})`,
    },
  ];
}

/**
 * Format dung lượng MB thành chuỗi đọc dễ nhìn (MB / GB)
 */
function formatStorage(mb: number): string {
  if (!mb || mb <= 0) return "0 MB";
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toLocaleString("vi-VN")} MB`;
}

export function DailyUploadStatsSection({
  initialData,
  initialDate,
}: DailyUploadStatsSectionProps) {
  const dateOptions = useMemo(() => getRecent3DateOptions(), []);
  const defaultDate = initialDate || dateOptions[0]?.value || "";

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [stats, setStats] = useState<DailyUploadStats>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleDateChange = (newDate: string) => {
    if (newDate === selectedDate || isPending) return;
    setSelectedDate(newDate);

    startTransition(async () => {
      try {
        const data = await getDailyUploadStatsAction(newDate);
        setStats(data);
      } catch (error) {
        console.error("Lỗi khi tải thống kê upload hàng ngày:", error);
      }
    });
  };

  const handleRefresh = () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const data = await getDailyUploadStatsAction(selectedDate);
        setStats(data);
      } catch (error) {
        console.error("Lỗi khi làm mới thống kê:", error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header & Select Option Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
              <span>Thống kê Upload & Lưu Trữ Hàng Ngày</span>
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Báo cáo hoạt động người dùng, số lượng ảnh, video, dung lượng &
              lỗi cho ngày:{" "}
              <span className="font-mono font-medium text-foreground">
                {selectedDate}
              </span>
            </p>
          </div>
        </div>

        {/* UI Select Component */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Select
            value={selectedDate}
            onValueChange={(val) => handleDateChange(val)}
            disabled={isPending}
          >
            <SelectTrigger className="w-[260px] h-9 text-xs font-medium bg-background border-input shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Chọn ngày xem thống kê..." />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              {dateOptions.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-xs cursor-pointer"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div
        className={cn(
          "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 transition-opacity duration-200",
          isPending && "opacity-60 pointer-events-none",
        )}
      >
        {/* Total Active Users */}
        <Card className="min-w-0 border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                User đăng ký mới
              </p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {stats.total_users.toLocaleString("vi-VN")}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                {selectedDate}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Total Uploaded Images */}
        <Card className="min-w-0 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent">
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Ảnh đã tải lên
              </p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {stats.total_images.toLocaleString("vi-VN")}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Locket Photos
              </p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
              <ImageIcon className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Total Uploaded Videos */}
        <Card className="min-w-0 border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent">
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Video đã tải lên
              </p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {stats.total_videos.toLocaleString("vi-VN")}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Locket Videos
              </p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
              <Video className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Total Storage Used */}
        <Card className="min-w-0 border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
          <CardContent className="p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Dung lượng sử dụng
              </p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {formatStorage(stats.total_storage_mb)}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                {stats.total_storage_mb.toLocaleString("vi-VN")} MB
              </p>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Database className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Total Errors */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Card
              className={cn(
                "min-w-0 border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent cursor-pointer hover:bg-rose-500/10 transition-colors",
                stats.total_errors > 0 && "border-rose-500/50 bg-rose-500/10",
              )}
            >
              <CardContent className="p-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Lỗi phát sinh
                  </p>
                  <h3
                    className={cn(
                      "text-lg font-bold mt-0.5",
                      stats.total_errors > 0 ? "text-rose-500" : "text-foreground",
                    )}
                  >
                    {stats.total_errors.toLocaleString("vi-VN")}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    {stats.total_errors > 0 ? "Bấm xem chi tiết" : "Bình thường"}
                  </p>
                </div>
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0",
                    stats.total_errors > 0
                      ? "bg-rose-500/20 text-rose-500"
                      : "bg-gray-500/10 text-gray-500",
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </DropdownMenuTrigger>
          {stats.total_errors > 0 && stats.error_details && Object.keys(stats.error_details).length > 0 && (
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Chi tiết mã lỗi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(stats.error_details)
                .sort((a, b) => Number(b[1]) - Number(a[1]))
                .map(([code, count]) => (
                <DropdownMenuItem key={code} className="flex justify-between items-center text-sm cursor-default">
                  <span className="font-mono text-rose-500 font-semibold">Lỗi {code}</span>
                  <span className="font-bold">{Number(count).toLocaleString("vi-VN")}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>
    </div>
  );
}
