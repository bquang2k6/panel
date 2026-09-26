"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { MonthlyUsersPoint } from "@/lib/queries/dashboard";

interface MonthlyUsersChartProps {
  data: MonthlyUsersPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const isDaily = label && String(label).length <= 5;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="font-semibold text-foreground">
        {isDaily ? `Ngày ${label}` : `Tháng ${label}`}
      </p>
      <p className="text-purple-500 font-medium">👤 {payload[0]?.value} user đăng ký mới</p>
    </div>
  );
}

export function MonthlyUsersChart({ data }: MonthlyUsersChartProps) {
  const avg = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.users, 0) / data.length)
    : 0;

  const isDaily = data.length > 0 && data[0]?.month && String(data[0].month).length <= 5;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="monthlyUsersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
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
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {avg > 0 && (
          <ReferenceLine
            y={avg}
            stroke="#a855f7"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={{ value: isDaily ? `TB/Ngày: ${avg}` : `TB/Tháng: ${avg}`, fill: "#a855f7", fontSize: 10, position: "insideTopRight" }}
          />
        )}
        <Line
          type="monotone"
          dataKey="users"
          stroke="#a855f7"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#a855f7" }}
          activeDot={{ r: 5, fill: "#a855f7" }}
          name="User mới"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
