"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export function PWARegister() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("[PWA] Service Worker registered with scope:", registration.scope);

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("[PWA] New version available!");
                toast({
                  title: "Phiên bản mới khả dụng",
                  description: "Nội dung ứng dụng đã được cập nhật.",
                });
              }
            });
          }
        });
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    };

    registerSW();

    // Listen for online / offline status change
    const handleOnline = () => {
      toast({
        title: "Đã khôi phục kết nối",
        description: "Bạn đã kết nối lại Internet.",
      });
    };

    const handleOffline = () => {
      toast({
        title: "Mất kết nối mạng",
        description: "Ứng dụng đang chạy ở chế độ Offline (Cache).",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  return null;
}
