"use client";

import { useEffect, useState } from "react";
import { Filter, Plus, Search, Pin, Trash2, Edit } from "lucide-react";

import { notificationActions } from "@/features/datacenter/actions";
import type { NotificationItem } from "@/features/datacenter/types";
import { NotificationDialog } from "@/components/datacenter/notification-dialog";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationItem | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const data = await notificationActions.getAll();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setEditing(null);
    setOpen(true);
  }

  function handleEdit(item: NotificationItem) {
    setEditing(item);
    setOpen(true);
  }

  async function handleTogglePin(id: string) {
    try {
      await notificationActions.togglePin(id);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;

    try {
      await notificationActions.delete(id);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = notifications.filter(
    (n) =>
      (n.title && n.title.toLowerCase().includes(search.toLowerCase())) ||
      n.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Quản lý Thông báo (locketdio_notifications)"
          description="Quản lý tin nhắn thông báo hệ thống và các tin ghim (pinned)."
        />

        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm thông báo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} className="bg-primary">
              <Plus className="h-4 w-4 mr-1.5" />
              Tạo Thông Báo Mới
            </Button>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>#</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Nội dung thông báo</TableHead>
                <TableHead>Ghim (Pinned)</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Đang tải danh sách thông báo...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy bản ghi thông báo nào.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-semibold text-sm">
                      {item.title ?? "Chưa có tiêu đề"}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                      {item.message}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item.id)}
                        title="Click để thay đổi trạng thái ghim"
                      >
                        {item.pinned ? (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 text-[11px] hover:bg-amber-500/20 cursor-pointer">
                            <Pin className="h-3 w-3" /> Đã Ghim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] hover:bg-accent cursor-pointer">
                            Bình thường
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {item.created_at ? formatDate(item.created_at) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <NotificationDialog
        open={open}
        onOpenChange={setOpen}
        notification={editing}
        onSuccess={fetchNotifications}
      />
    </>
  );
}
