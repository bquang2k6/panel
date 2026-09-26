"use client";

import { useEffect, useState } from "react";
import { Filter, Plus, Search, Trash2, Edit, Globe } from "lucide-react";

import { celebrateActions } from "@/features/datacenter/actions";
import type { CelebrateItem } from "@/features/datacenter/types";
import { CelebrateDialog } from "@/components/datacenter/celebrate-dialog";

import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
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

export default function TimelinePage() {
  const [items, setItems] = useState<CelebrateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CelebrateItem | null>(null);

  useEffect(() => {
    fetchCelebrates();
  }, []);

  async function fetchCelebrates() {
    try {
      setLoading(true);
      const data = await celebrateActions.getAll();
      setItems(data);
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

  function handleEdit(item: CelebrateItem) {
    setEditing(item);
    setOpen(true);
  }

  async function handleToggleActive(id: string) {
    try {
      await celebrateActions.toggleActive(id);
      await fetchCelebrates();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi celebrate này?")) return;

    try {
      await celebrateActions.delete(id);
      await fetchCelebrates();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = items.filter(
    (item) =>
      (item.username && item.username.toLowerCase().includes(search.toLowerCase())) ||
      (item.note && item.note.toLowerCase().includes(search.toLowerCase())) ||
      (item.uid && item.uid.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Quản lý Timeline & Celebrate List (celebrate_list)"
          description="Quản lý danh sách kỷ niệm, mã kích hoạt và trạng thái active của người dùng."
        />

        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo Username, UID hoặc Ghi chú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd} className="bg-primary">
              <Plus className="h-4 w-4 mr-1.5" />
              Thêm Celebrate Mới
            </Button>
          </div>
        </div>

        {/* Celebrate List Table */}
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>#</TableHead>
                <TableHead>Username / UID</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Ghi chú (Note)</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    Đang tải danh sách celebrate_list...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    Không tìm thấy bản ghi celebrate_list nào.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{item.username ?? "N/A"}</span>
                        <span className="text-xs text-muted-foreground font-mono">{item.uid ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item.id)}
                        className="cursor-pointer"
                        title="Click để bật/tắt trạng thái Active"
                      >
                        {item.active ? (
                          <StatusBadge status="active" label="Active" />
                        ) : (
                          <StatusBadge status="inactive" label="Tắt" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs gap-1 font-mono">
                        <Globe className="h-3 w-3 text-primary" /> {item.country_code ?? "VN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {item.note ?? "—"}
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

      <CelebrateDialog
        open={open}
        onOpenChange={setOpen}
        celebrate={editing}
        onSuccess={fetchCelebrates}
      />
    </>
  );
}