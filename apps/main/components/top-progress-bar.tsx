"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Khi URL thay đổi -> Kết thúc hiệu ứng tải
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Lắng nghe sự kiện click vào các đường dẫn liên kết nội bộ trong trang
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const targetAttr = anchor.getAttribute("target");

        // Kiểm tra nếu là link nội bộ (cùng domain, không mở tab mới, không phải anchor #)
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("#") &&
          targetAttr !== "_blank"
        ) {
          const currentUrl = `${pathname}${
            searchParams.toString() ? `?${searchParams.toString()}` : ""
          }`;

          if (href !== currentUrl) {
            setLoading(true);
            setProgress(30);
            const interval = setInterval(() => {
              setProgress((prev) => {
                if (prev >= 80) {
                  clearInterval(interval);
                  return prev;
                }
                return prev + 15;
              });
            }, 100);
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: loading || progress > 0 ? 1 : 0,
        }}
      />
    </div>
  );
}
