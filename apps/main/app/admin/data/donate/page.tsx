"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, Search, Trash2, Edit } from "lucide-react";

import { donationActions } from "@/features/datacenter/actions";
import type { Donation } from "@/features/datacenter/types";
import { DonateDialog } from "@/components/datacenter/donate-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export default function DonatePage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Donation | null>(null);

  const [sortBy, setSortBy] = useState<"amount" | "date">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchDonations();
  }, []);

  async function fetchDonations() {
    try {
      setLoading(true);
      const data = await donationActions.getAll();
      setDonations(data);
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

  function handleEdit(item: Donation) {
    setEditing(item);
    setOpen(true);
  }

  async function handleDelete(id: string | number) {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi donate này?")) return;

    try {
      await donationActions.delete(id);
      await fetchDonations();
    } catch (err) {
      console.error(err);
    }
  }

  function toggleSort(field: "amount" | "date") {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  }

  const filteredDonations = useMemo(() => {
    const keyword = search.toLowerCase();

    return [...donations]
      .filter(
        (item) =>
          item.donorname.toLowerCase().includes(keyword) ||
          (item.message && item.message.toLowerCase().includes(keyword)),
      )
      .sort((a, b) => {
        if (sortBy === "amount") {
          return sortDirection === "asc"
            ? a.amount - b.amount
            : b.amount - a.amount;
        }

        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [donations, search, sortBy, sortDirection]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Quản lý Donate (locketwan_donate)"
          description="Quản lý lịch sử ủng hộ donate và thông điệp của nhà tài trợ."
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search donor or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => toggleSort("amount")}
            >
              <Filter className="mr-2 h-4 w-4" />
              Sắp xếp Số tiền ({sortDirection})
            </Button>

            <Button
              variant="outline"
              onClick={() => toggleSort("date")}
            >
              <Filter className="mr-2 h-4 w-4" />
              Sắp xếp Ngày ({sortDirection})
            </Button>

            <Button onClick={handleAdd} className="bg-primary">
              <Plus className="mr-2 h-4 w-4" />
              Thêm Donate Mới
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>#</TableHead>
                <TableHead>Người Donate</TableHead>
                <TableHead>Số tiền ủng hộ</TableHead>
                <TableHead>Lời nhắn (Message)</TableHead>
                <TableHead>Ngày chuyển</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground"
                  >
                    Đang tải dữ liệu Donate...
                  </TableCell>
                </TableRow>
              ) : filteredDonations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground"
                  >
                    Chưa có bản ghi Donate nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDonations.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs">{index + 1}</TableCell>

                    <TableCell className="font-semibold text-sm">
                      {item.donorname}
                    </TableCell>

                    <TableCell className="font-mono text-emerald-600 font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>

                    <TableCell className="max-w-sm truncate text-xs text-muted-foreground">
                      {item.message || "—"}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(item.date)}
                    </TableCell>

                    <TableCell>
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

      <DonateDialog
        open={open}
        onOpenChange={setOpen}
        donation={editing}
        onSuccess={fetchDonations}
      />
    </>
  );
}