import Link from "next/link";
import { TriangleAlert, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="h-10 w-10 text-destructive" />
      </div>

      <h1 className="text-5xl font-bold tracking-tight">404</h1>

      <h2 className="mt-3 text-2xl font-semibold">
        Không tìm thấy trang
      </h2>

      <p className="mt-3 max-w-md text-muted-foreground">
        Trang bạn đang tìm kiếm không tồn tại, đã bị di chuyển hoặc URL không chính xác.
      </p>

      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}