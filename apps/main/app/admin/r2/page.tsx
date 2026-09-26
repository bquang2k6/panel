"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Globe,
  Activity,
  RefreshCw,
  AlertTriangle,
  Users,
  BarChart3,
  Link as LinkIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ZoneAnalyticsData = {
  totalRequests: number;
  totalVisits: number;
  totalBytes: number;
  chartData: Array<{
    time: string;
    requests: number;
    visits: number;
    bytesMB: number;
  }>;
  topPaths: Array<{
    path: string;
    requests: number;
    bytesMB: number;
  }>;
};

export default function ZoneAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");
  const [data, setData] = useState<ZoneAnalyticsData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAnalytics = useCallback(async (currentPeriod: string) => {
    try {
      setRefreshing(true);
      setErrorMsg(null);
      const res = await fetch(`/api/admin/zone-analytics?period=${currentPeriod}`);
      const json = await res.json();
      if (json.success && json.analytics) {
        setData(json.analytics);
        setLastUpdated(new Date().toLocaleTimeString("vi-VN"));
      } else {
        setErrorMsg(json.message || "Không thể tải dữ liệu");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString("vi-VN");
  };

  if (!mounted) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-12 w-72 rounded-xl bg-muted/60 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border bg-card animate-pulse p-4" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Cloudflare Analytics Analytics
              </h1>
              <p className="text-xs text-muted-foreground">
                Thống kê lưu lượng truy cập HTTP (Requests, Visits, Bandwidth)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(period)}
            disabled={refreshing}
            className="h-9 px-3 text-xs gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin text-orange-500")} />
            <span>Làm mới</span>
          </Button>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Cập nhật: {lastUpdated}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b pb-3">
        {["24h", "7d", "30d"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p as any)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
              period === p
                ? "bg-orange-500/10 text-orange-600 font-bold border border-orange-500/20"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {p === "24h" ? "24 Giờ qua" : p === "7d" ? "7 Ngày qua" : "30 Ngày qua"}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-900 dark:text-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-semibold text-sm text-red-600 dark:text-red-400">
                Lỗi truy vấn:
              </p>
              <p className="font-mono text-[11px] bg-background/80 p-2 rounded border border-red-500/20 text-foreground">
                {errorMsg}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse p-4" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="transition-all hover:border-orange-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Tổng Requests ({period})</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-foreground">
                {formatNumber(data.totalRequests)}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:border-blue-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Tổng Visits</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-foreground">
                {formatNumber(data.totalVisits)}
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all hover:border-emerald-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Tổng Băng thông (Edge)</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <BarChart3 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-foreground">
                {formatBytes(data.totalBytes)}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 space-y-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                Lưu lượng HTTP Requests ({period})
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[400px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="rounded-lg border bg-background px-3.5 py-2.5 shadow-xl text-xs space-y-1.5">
                          <p className="font-semibold text-foreground border-b pb-1">{label}</p>
                          <div className="flex items-center justify-between gap-4 text-orange-500 font-medium">
                            <span>Requests:</span>
                            <span className="font-bold">{formatNumber(d?.requests)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-blue-500 font-medium">
                            <span>Visits:</span>
                            <span className="font-bold">{formatNumber(d?.visits)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-emerald-500 font-medium pt-0.5 border-t">
                            <span>Bandwidth:</span>
                            <span className="font-bold">{d?.bytesMB} MB</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-purple-500" />
                Top Paths ({period})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-2">
              <div className="rounded-md border h-full max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs w-[60%]">Đường dẫn</TableHead>
                      <TableHead className="text-xs text-right">Requests</TableHead>
                      <TableHead className="text-xs text-right">MB</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topPaths.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono max-w-[120px] truncate" title={p.path}>
                          {p.path}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {formatNumber(p.requests)}
                        </TableCell>
                        <TableCell className="text-xs text-right text-emerald-600 dark:text-emerald-400">
                          {formatNumber(p.bytesMB)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
