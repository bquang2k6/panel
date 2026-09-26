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
import type { DailyUsersPoint } from "@/lib/queries/dashboard";

interface UsersLineChartProps {
  data: DailyUsersPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-violet-500">👤 {payload[0]?.value} user mới</p>
    </div>
  );
}

export function UsersLineChart({ data }: UsersLineChartProps) {
  const avg = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.users, 0) / data.length)
    : 0;

  const tickIndices = new Set(
    data.map((_, i) => i).filter((i) => i % 5 === 0 || i === data.length - 1)
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
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
            stroke="#8b5cf6"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{ value: `TB: ${avg}`, fill: "#8b5cf6", fontSize: 10, position: "insideTopRight" }}
          />
        )}
        <Line
          type="monotone"
          dataKey="users"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#8b5cf6" }}
          name="User mới"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
