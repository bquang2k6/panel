"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Server,
  Zap,
  Globe,
  Key,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  testSupabaseConnection,
  getSavedConnections,
  saveConnection,
  deleteConnection,
  setActiveConnection,
} from "@/features/datacenter/db-actions";
import type {
  DatabaseConnection,
  ConnectionTestResult,
} from "@/features/datacenter/db-types";

export default function DatabaseConnectionPage() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Testing & Status states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSavedConnections();
      setConnections(data);
    } catch (e) {
      console.error("Lỗi tải danh sách kết nối:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Test kết nối
  async function handleTestConnection() {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setTestResult({
        success: false,
        message: "Vui lòng nhập đầy đủ Supabase URL và Supabase Key trước khi kết nối.",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setTestResult(result);
    setTesting(false);
  }

  // Lưu kết nối mới vào Supabase gốc
  async function handleSaveConnection(e: React.FormEvent) {
    e.preventDefault();

    if (!testResult?.success) {
      alert("Vui lòng ấn 'Kiểm tra kết nối' và đảm bảo kết nối thành công trước khi lưu.");
      return;
    }

    setSaveError(null);
    setActionLoading("save");

    try {
      await saveConnection({
        name: name.trim() || `Supabase Database`,
        supabase_url: supabaseUrl,
        supabase_key: supabaseKey,
        is_active: false,
      });

      // Reset form
      setName("");
      setSupabaseUrl("");
      setSupabaseKey("");
      setTestResult(null);
      await loadConnections();
    } catch (err: any) {
      setSaveError(err?.message || "Không thể lưu kết nối. Vui lòng thử lại.");
    } finally {
      setActionLoading(null);
    }
  }

  // Xóa kết nối
  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa cấu hình kết nối database này?")) return;
    setActionLoading(id);
    try {
      await deleteConnection(id);
      await loadConnections();
    } catch (err: any) {
      alert(err?.message || "Không thể xóa kết nối.");
    } finally {
      setActionLoading(null);
    }
  }

  // Kích hoạt kết nối
  async function handleMakeActive(id: string) {
    setActionLoading(id);
    try {
      await setActiveConnection(id);
      await loadConnections();
    } catch (err: any) {
      alert(err?.message || "Không thể kích hoạt kết nối.");
    } finally {
      setActionLoading(null);
    }
  }

  const maskKey = (key: string) => {
    if (!key || key.length < 16) return "••••••••••••••••";
    return `${key.substring(0, 10)}...${key.substring(key.length - 6)}`;
  };

  const activeConnection = connections.find((c) => c.is_active && !c.is_primary);

  return (
    <div className="flex flex-col gap-6 max-w-full overflow-hidden">
      <PageHeader
        title="Quản lý Database (DataCenter)"
        description="Cấu hình, kiểm tra kết nối và lưu trữ thông tin cơ sở dữ liệu Supabase."
      />

      {/* Thông tin kết nối Active hiện tại (ngoài Primary) */}
      {activeConnection && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 max-w-full">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold text-emerald-950 dark:text-emerald-100 truncate">
                    DataCenter đang dùng: {activeConnection.name}
                  </CardTitle>
                  <CardDescription className="text-xs truncate">
                    Tất cả truy vấn DataCenter sẽ gửi tới instance Supabase này.
                  </CardDescription>
                </div>
              </div>
              <StatusBadge status="active" label="Đang Hoạt Động" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 text-xs space-y-1.5 text-muted-foreground font-mono max-w-full overflow-hidden">
            <div className="flex items-center gap-2 max-w-full overflow-hidden">
              <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="shrink-0">URL:</span>
              <strong className="text-foreground truncate max-w-full inline-block">{activeConnection.supabase_url}</strong>
            </div>
            <div className="flex items-center gap-2 max-w-full overflow-hidden">
              <Key className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="shrink-0">Key:</span>
              <strong className="text-foreground truncate max-w-full inline-block">{maskKey(activeConnection.supabase_key)}</strong>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsive Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3 max-w-full">
        {/* Form nhập thông tin Supabase */}
        <Card className="lg:col-span-1 shadow-sm max-w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="h-5 w-5 text-primary shrink-0" />
              Thêm Database Cần Quản Lý
            </CardTitle>
            <CardDescription className="text-xs">
              Nhập thông tin URL và Key của dự án Supabase để kiểm tra và thêm vào hệ thống.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleSaveConnection} className="space-y-4 max-w-full">
              {/* Tên cấu hình */}
              <div className="space-y-1.5 w-full min-w-0">
                <Label htmlFor="db-name" className="text-xs font-semibold">
                  Tên gợi nhớ Database
                </Label>
                <Input
                  id="db-name"
                  placeholder="Ví dụ: Supabase Production"
                  className="text-xs sm:text-sm w-full min-w-0 truncate"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setTestResult(null); setSaveError(null); }}
                />
              </div>

              {/* Supabase URL */}
              <div className="space-y-1.5 w-full min-w-0">
                <Label htmlFor="supabase-url" className="text-xs font-semibold">
                  1. Supabase URL <span className="text-destructive">*</span>
                </Label>
                <div className="relative w-full min-w-0">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="supabase-url"
                    type="url"
                    placeholder="https://xxxx.supabase.co"
                    className="pl-9 text-xs sm:text-sm w-full min-w-0 truncate"
                    value={supabaseUrl}
                    onChange={(e) => { setSupabaseUrl(e.target.value); setTestResult(null); setSaveError(null); }}
                    required
                  />
                </div>
              </div>

              {/* Supabase Key */}
              <div className="space-y-1.5 w-full min-w-0">
                <Label htmlFor="supabase-key" className="text-xs font-semibold">
                  2. Supabase Key (Anon / Service Role) <span className="text-destructive">*</span>
                </Label>
                <div className="relative w-full min-w-0">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="supabase-key"
                    type={showKey ? "text" : "password"}
                    placeholder="eyJhbGciOiJIUzI1Ni..."
                    className="pl-9 pr-10 text-xs sm:text-sm w-full min-w-0 truncate"
                    value={supabaseKey}
                    onChange={(e) => { setSupabaseKey(e.target.value); setTestResult(null); setSaveError(null); }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 z-10"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Kết quả test */}
              {testResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2 border break-words ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{testResult.success ? "Kết nối hợp lệ!" : "Kết nối thất bại"}</p>
                    <p className="mt-0.5 opacity-90 break-words">{testResult.message}</p>
                  </div>
                </div>
              )}

              {/* Lỗi lưu */}
              {saveError && (
                <div className="p-3 rounded-lg text-xs flex items-start gap-2 border bg-destructive/10 border-destructive/30 text-destructive break-words">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="break-words">{saveError}</p>
                </div>
              )}

              {/* Các nút bấm */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !supabaseUrl || !supabaseKey}
                  className="w-full text-xs sm:text-sm"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4 text-amber-500" />
                      Kiểm Tra Kết Nối (Test)
                    </>
                  )}
                </Button>

                <Button
                  type="submit"
                  disabled={!testResult?.success || actionLoading === "save"}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm"
                >
                  {actionLoading === "save" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Lưu & Thêm Vào Danh Sách
                    </>
                  )}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground text-center italic">
                * Nút &quot;Lưu & Thêm&quot; chỉ mở khóa sau khi Test kết nối thành công.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Bảng danh sách */}
        <div className="lg:col-span-2 space-y-6 max-w-full">
          <Card className="shadow-sm overflow-hidden max-w-full">
            <CardHeader className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary shrink-0" />
                  Danh Sách Database Đang Quản Lý
                </CardTitle>
                <CardDescription className="text-xs">
                  Tổng số: {Math.max(0, connections.length - 1)} database bổ sung đã kết nối.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadConnections}
                disabled={loading}
                className="shrink-0 text-xs"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-1.5">Làm mới</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table className="w-full min-w-[500px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Tên / Trạng thái</TableHead>
                      <TableHead>Supabase URL</TableHead>
                      <TableHead>Key (Che phủ)</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                          Đang tải danh sách kết nối...
                        </TableCell>
                      </TableRow>
                    ) : (
                      connections.map((conn, index) => (
                        <TableRow
                          key={conn.id}
                          className={conn.is_primary ? "bg-muted/30" : undefined}
                        >
                          <TableCell className="font-medium text-xs">{index + 1}</TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {conn.is_primary && (
                                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                                <span className="font-semibold text-sm">{conn.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {conn.is_primary ? (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary">
                                    Supabase Gốc
                                  </Badge>
                                ) : conn.is_active ? (
                                  <StatusBadge status="active" label="DataCenter Active" />
                                ) : (
                                  <StatusBadge status="inactive" label="Sẵn sàng" />
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="font-mono text-xs max-w-[150px] sm:max-w-[200px] truncate">
                            {conn.supabase_url}
                          </TableCell>

                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {maskKey(conn.supabase_key)}
                          </TableCell>

                          <TableCell>
                            {conn.is_primary ? (
                              /* Supabase gốc: disable tất cả nút */
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs shrink-0 opacity-40 cursor-not-allowed"
                                  disabled
                                >
                                  Mặc định
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {!conn.is_active && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs shrink-0"
                                    disabled={actionLoading === conn.id}
                                    onClick={() => handleMakeActive(conn.id)}
                                  >
                                    {actionLoading === conn.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      "Kết nối"
                                    )}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                                  disabled={actionLoading === conn.id}
                                  onClick={() => handleDelete(conn.id)}
                                >
                                  {actionLoading === conn.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {!loading && connections.length <= 1 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                          Chưa có database bổ sung nào. Hãy dùng form bên trái để thêm mới.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
