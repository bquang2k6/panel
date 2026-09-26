"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function OrdersPagination({
  page,
  totalPages,
  total,
  pageSize,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Tính dãy số trang hiển thị (tối đa 5 trang)
  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift(-1); // dấu ...
    if (page + delta < totalPages - 1) range.push(-2); // dấu ...
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-2 py-3 text-sm text-muted-foreground">
        <span>
          {total === 0
            ? "Không có đơn hàng nào"
            : `Hiển thị ${from}–${to} / ${total} đơn hàng`}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 py-3 sm:flex-row">
      <span className="text-sm text-muted-foreground">
        Hiển thị {from}–{to} / {total} đơn hàng
      </span>

      <div className="flex items-center gap-1">
        {/* First */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goTo(1)}
          disabled={page === 1 || isPending}
          title="Trang đầu"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Prev */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goTo(page - 1)}
          disabled={page === 1 || isPending}
          title="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        {getPageNumbers().map((p, i) => {
          if (p < 0) {
            return (
              <span
                key={`ellipsis-${i}`}
                className="px-1 text-muted-foreground select-none"
              >
                …
              </span>
            );
          }
          return (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              className={cn("h-8 w-8 text-xs", p === page && "pointer-events-none")}
              onClick={() => goTo(p)}
              disabled={isPending}
            >
              {p}
            </Button>
          );
        })}

        {/* Next */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goTo(page + 1)}
          disabled={page === totalPages || isPending}
          title="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => goTo(totalPages)}
          disabled={page === totalPages || isPending}
          title="Trang cuối"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
