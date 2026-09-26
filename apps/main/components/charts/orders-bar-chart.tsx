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
import type { DailyOrdersPoint } from "@/lib/queries/dashboard";

interface OrdersBarChartProps {
  data: DailyOrdersPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function OrdersBarChart({ data }: OrdersBarChartProps) {
  const tickIndices = new Set(
    data.map((_, i) => i).filter((i) => i % 3 === 0 || i === data.length - 1)
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={8}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v, i) => (tickIndices.has(i) ? v : "")}
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
            value === "paid" ? "Thành công" : value === "pending" ? "Chờ TT" : "Đã hủy"
          }
        />
        <Bar dataKey="paid" name="paid" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="pending" name="pending" fill="#f59e0b" radius={[3, 3, 0, 0]} />
        <Bar dataKey="cancelled" name="cancelled" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
