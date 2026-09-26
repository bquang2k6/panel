"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyRevenuePoint } from "@/lib/queries/dashboard";

interface MonthlyRevenueChartProps {
  data: MonthlyRevenuePoint[];
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const revenue: number = payload[0]?.value ?? 0;
  const orders: number = payload[1]?.value ?? 0;
  const isDaily = label && String(label).length <= 5;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-semibold text-foreground">
        {isDaily ? `Ngày ${label}` : `Tháng ${label}`}
      </p>
      <p className="text-emerald-500 font-medium">
        💰 Doanh thu: {revenue.toLocaleString("vi-VN")} ₫
      </p>
      <p className="text-blue-500 font-medium">📦 Đơn thành công: {orders} đơn</p>
    </div>
  );
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="monthlyRevenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="monthlyOrdersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2.5}
          fill="url(#monthlyRevenueGrad)"
          dot={{ r: 3, fill: "#10b981" }}
          activeDot={{ r: 5 }}
          name="Doanh thu"
        />
        <Area
          type="monotone"
          dataKey="orders"
          stroke="#3b82f6"
          strokeWidth={1.5}
          fill="url(#monthlyOrdersGrad)"
          dot={false}
          activeDot={{ r: 4 }}
          name="Số đơn"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
