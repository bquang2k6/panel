"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderStatusFilter } from "@/lib/queries/orders";

const STATUS_OPTIONS: { value: OrderStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ thanh toán" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "FAILED", label: "Thất bại" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Hết hạn" },
];

export function OrdersToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = (searchParams.get("status") ??
    "ALL") as OrderStatusFilter;

  const [search, setSearch] = useState(currentSearch);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      params.set("page", "1");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  const handleSearch = () => {
    updateParams({ search });
  };

  const handleStatus = (value: string) => {
    updateParams({
      status: value === "ALL" ? "" : value,
    });
  };

  const handleClear = () => {
    setSearch("");

    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasFilters = currentSearch || currentStatus !== "ALL";

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 flex-1 lg:flex-row">
        {/* Search */}
        <div className="flex w-full gap-2 lg:max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Tìm theo mã đơn, customer code..."
              className="pl-10"
              disabled={isPending}
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={isPending}
            className="shrink-0"
          >
            <Search className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">Tìm kiếm</span>
          </Button>
        </div>

        {/* Status Filter */}
        <Select
          value={currentStatus}
          onValueChange={handleStatus}
          disabled={isPending}
        >
          <SelectTrigger className="w-full lg:w-[200px]">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={isPending}
          className="w-full lg:w-auto"
        >
          <X className="mr-2 h-4 w-4" />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}
