"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyOrdersPoint } from "@/lib/queries/dashboard";

interface MonthlyOrdersChartProps {
  data: MonthlyOrdersPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const isDaily = label && String(label).length <= 5;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-semibold text-foreground">
        {isDaily ? `Ngày ${label}` : `Tháng ${label}`}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-medium">
          {p.name === "paid" ? "Thành công" : p.name === "pending" ? "Chờ thanh toán" : "Đã hủy/Thất bại"}: {p.value} đơn
        </p>
      ))}
    </div>
  );
}

export function MonthlyOrdersChart({ data }: MonthlyOrdersChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={12}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) =>
            value === "paid" ? "Thành công" : value === "pending" ? "Chờ thanh toán" : "Đã hủy"
          }
        />
        <Bar dataKey="paid" name="paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="pending" name="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cancelled" name="cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
