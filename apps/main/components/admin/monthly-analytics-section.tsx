"use client";

import { useState, useTransition } from "react";
import { CalendarRange, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { MonthlyOrdersChart } from "@/components/charts/monthly-orders-chart";
import { MonthlyUsersChart } from "@/components/charts/monthly-users-chart";
import type {
  MonthlyRevenuePoint,
  MonthlyOrdersPoint,
  MonthlyUsersPoint,
} from "@/lib/queries/dashboard";
import { getMonthlyAnalyticsAction } from "@/app/admin/dashboard/actions";
import { cn } from "@/lib/utils";

interface MonthlyAnalyticsSectionProps {
  initialRevenueData: MonthlyRevenuePoint[];
  initialOrdersData: MonthlyOrdersPoint[];
  initialUsersData: MonthlyUsersPoint[];
  initialMonths?: number;
}

const MONTH_OPTIONS = [
  { value: 1, label: "30 ngày" },
  { value: 3, label: "3 tháng" },
  { value: 6, label: "6 tháng" },
  { value: 12, label: "12 tháng" },
];

const formatMonthsLabel = (months: number) => {
  return months === 1 ? "30 ngày" : `${months} tháng`;
};

export function MonthlyAnalyticsSection({
  initialRevenueData,
  initialOrdersData,
  initialUsersData,
  initialMonths = 1,
}: MonthlyAnalyticsSectionProps) {
  const [selectedMonths, setSelectedMonths] = useState<number>(initialMonths);
  const [revenueData, setRevenueData] = useState<MonthlyRevenuePoint[]>(initialRevenueData);
  const [ordersData, setOrdersData] = useState<MonthlyOrdersPoint[]>(initialOrdersData);
  const [usersData, setUsersData] = useState<MonthlyUsersPoint[]>(initialUsersData);
  const [isPending, startTransition] = useTransition();

  const handleSelectMonths = (months: number) => {
    if (months === selectedMonths || isPending) return;
    setSelectedMonths(months);

    startTransition(async () => {
      try {
        const res = await getMonthlyAnalyticsAction(months);
        setRevenueData(res.revenueData);
        setOrdersData(res.ordersData);
        setUsersData(res.usersData);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu thống kê tháng:", error);
      }
    });
  };

  const currentPeriodLabel = formatMonthsLabel(selectedMonths);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Phân tích & Thống kê Theo Tháng
            </h2>
            <p className="text-xs text-muted-foreground">
              Theo dõi biến động doanh thu, đơn hàng và lượng người dùng trong {currentPeriodLabel} gần nhất
            </p>
          </div>
        </div>

        {/* Timeframe Select Buttons */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs font-medium self-start sm:self-auto">
          {MONTH_OPTIONS.map((opt) => {
            const isActive = selectedMonths === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectMonths(opt.value)}
                disabled={isPending}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all duration-200 select-none flex items-center gap-1.5",
                  isActive
                    ? "bg-background text-foreground font-semibold shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  isPending && isActive && "opacity-80"
                )}
              >
                {isPending && isActive && (
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content grid with subtle loading overlay */}
      <div className={cn("space-y-4 transition-opacity duration-200", isPending && "opacity-60 pointer-events-none")}>
        {/* Row 1: Monthly Revenue & Monthly Orders */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="min-w-0 overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Doanh thu theo Tháng</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono capitalize">
                  {currentPeriodLabel}
                </span>
              </CardTitle>
              <CardDescription>
                Tổng doanh thu (PAID) và tổng đơn thành công trong {currentPeriodLabel} gần nhất
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 min-w-0">
              <MonthlyRevenueChart data={revenueData} />
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Trạng thái Đơn hàng theo Tháng</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono capitalize">
                  {currentPeriodLabel}
                </span>
              </CardTitle>
              <CardDescription>
                Số lượng đơn theo trạng thái (Thành công / Chờ TT / Hủy) trong {currentPeriodLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 min-w-0">
              <MonthlyOrdersChart data={ordersData} />
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Monthly Users */}
        <div className="grid gap-4">
          <Card className="min-w-0 overflow-hidden border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>User Mới Đăng Ký theo Tháng</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-mono capitalize">
                  {currentPeriodLabel}
                </span>
              </CardTitle>
              <CardDescription>
                Tăng trưởng người dùng mới trong {currentPeriodLabel}, nét đứt biểu thị mức trung bình
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 min-w-0">
              <MonthlyUsersChart data={usersData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
