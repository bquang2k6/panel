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
import type { DailyRevenuePoint } from "@/lib/queries/dashboard";

interface RevenueChartProps {
  data: DailyRevenuePoint[];
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const revenue: number = payload[0]?.value ?? 0;
  const orders: number = payload[1]?.value ?? 0;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-green-500">
        💰 {revenue.toLocaleString("vi-VN")} ₫
      </p>
      <p className="text-muted-foreground">📦 {orders} đơn</p>
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Thinned labels: chỉ hiển thị mỗi 5 ngày trên trục X
  const tickIndices = new Set(
    data.map((_, i) => i).filter((i) => i % 5 === 0 || i === data.length - 1)
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v, i) => (tickIndices.has(i) ? v : "")}
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
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4 }}
          name="Doanh thu"
        />
        <Area
          type="monotone"
          dataKey="orders"
          stroke="#3b82f6"
          strokeWidth={1.5}
          fill="url(#ordersGrad)"
          dot={false}
          activeDot={{ r: 4 }}
          name="Số đơn"
          yAxisId={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
