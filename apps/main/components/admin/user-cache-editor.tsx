"use client";

import { useState } from "react";
import {
  Search,
  Save,
  Copy,
  Trash2,
  Code2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  FileJson,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export function UserCacheEditor() {
  const { toast } = useToast();

  const [uid, setUid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Gọi API getUserCache theo UID
  const handleFetchUserCache = async () => {
    if (!uid.trim()) {
      toast({
        title: "Thiếu UID",
        description: "Vui lòng nhập UID người dùng cần tra cứu.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setJsonError(null);

      const res = await fetch("/api/admin/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get",
          uid: uid.trim(),
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Không thể tải cache từ API");
      }

      if (result.data) {
        setJsonText(JSON.stringify(result.data, null, 2));
        toast({
          title: "Đã lấy thành công Cache ⚡",
          description: `UID: ${uid.trim()}`,
        });
      } else {
        toast({
          title: "Không có dữ liệu",
          description: "API không trả về dữ liệu cho UID này.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: "Thông báo kết nối",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi thay đổi nội dung JSON
  const handleJsonChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(text);
      setJsonError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "JSON lỗi cú pháp";
      setJsonError(msg);
    }
  };

  // Format JSON
  const handleFormatJson = () => {
    if (!jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Cú pháp JSON chưa đúng";
      setJsonError(msg);
    }
  };

  // Sao chép JSON
  const handleCopyJson = () => {
    if (!jsonText) return;
    navigator.clipboard.writeText(jsonText);
    toast({
      title: "Đã sao chép 📋",
      description: "Dữ liệu JSON đã được lưu vào clipboard.",
    });
  };

  // Gọi API updateUserCache với body là json đã sửa
  const handleSaveUserCache = async () => {
    if (!jsonText.trim()) {
      toast({
        title: "Thiếu dữ liệu",
        description: "Vui lòng nhập dữ liệu JSON trước khi lưu.",
        variant: "destructive",
      });
      return;
    }

    if (jsonError) {
      toast({
        title: "Lỗi cú pháp JSON",
        description: "Vui lòng sửa các lỗi cú pháp JSON trước khi lưu.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const parsedData = JSON.parse(jsonText);

      const res = await fetch("/api/admin/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          data: parsedData,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Lỗi khi gọi API updateUserCache");
      }

      toast({
        title: "Cập nhật thành công! 🎉",
        description:
          result.message || "Đã gửi dữ liệu updateUserCache tới server.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: "Lỗi cập nhật",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUserCache = async () => {
    if (!uid.trim()) {
      toast({
        title: "Thiếu UID",
        description: "Vui lòng nhập UID người dùng cần xóa.",
        variant: "destructive",
      });
      return;
    }

    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa User Cache của UID:\n${uid.trim()}?`,
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);

      const res = await fetch("/api/admin/cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          uid: uid.trim(),
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Không thể xóa User Cache");
      }

      setJsonText("");
      setJsonError(null);

      toast({
        title: "Đã xóa User Cache 🗑️",
        description: result.data?.deleted
          ? `Đã xóa cache của UID: ${uid.trim()}`
          : "Cache không tồn tại.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      toast({
        title: "Lỗi xóa Cache",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 mx-auto w-full">
      {/* THANH TÌM KIẾM UID */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <span>Tra cứu & Quản lý User Cache</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Nhập UID để tải dữ liệu cache từ API{" "}
            <code className="font-mono text-primary font-bold">
              getUserCache
            </code>
            , chỉnh sửa trực tiếp và lưu lại qua{" "}
            <code className="font-mono text-primary font-bold">
              updateUserCache
            </code>
            .
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Nhập UID người dùng (VD: 00EHVEkAs2Wjsj96gfMah2rua422)..."
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="font-mono text-sm pl-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <Button
              onClick={handleFetchUserCache}
              disabled={isLoading}
              className="gap-2 font-semibold shrink-0"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>{isLoading ? "Đang tải..." : "Lấy Cache"}</span>
            </Button>

            <Button
              onClick={handleDeleteUserCache}
              disabled={isDeleting || isLoading || !uid.trim()}
              className="gap-2 font-semibold shrink-0"
            >
              {isDeleting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              <span>{isDeleting ? "Đang xóa..." : "Xóa Cache"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KHUNG CHỈNH SỬA JSON */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base font-bold">
                Dữ liệu JSON User Cache
              </CardTitle>
              <CardDescription className="text-xs">
                Chỉnh sửa trực tiếp dữ liệu bên dưới và nhấn "Lưu cập nhật".
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFormatJson}
              className="h-8 text-xs gap-1"
            >
              <FileJson className="h-3.5 w-3.5" />
              Định dạng JSON
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyJson}
              className="h-8 text-xs gap-1"
            >
              <Copy className="h-3.5 w-3.5" />
              Sao chép
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="relative">
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder="Nhấn 'Lấy Cache' để hiển thị cấu trúc JSON tại đây..."
              rows={20}
              className={`w-full rounded-lg border bg-slate-950 p-4 font-mono text-xs text-slate-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary ${
                jsonError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-border"
              }`}
            />

            {jsonError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-500 font-medium bg-red-500/10 p-2.5 rounded-md border border-red-500/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Lỗi cú pháp JSON: {jsonError}</span>
              </div>
            )}
          </div>

          {/* Nút lưu cập nhật */}
          <div className="flex items-center justify-end pt-2 border-t">
            <Button
              onClick={handleSaveUserCache}
              disabled={isSaving || !jsonText.trim() || !!jsonError}
              className="gap-2 font-bold px-8 bg-primary hover:bg-primary/90 text-sm"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>
                {isSaving ? "Đang lưu..." : "Lưu cập nhật (updateUserCache)"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
