"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 selection:bg-zinc-800">
      <div className="max-w-md w-full text-center space-y-6 bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto animate-pulse">
          <WifiOff className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Không có kết nối Internet</h1>
          <p className="text-sm text-zinc-400">
            Bạn hiện đang ở chế độ ngoại tuyến. Hãy kiểm tra kết nối mạng của bạn và thử lại.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-100 text-zinc-950 font-medium hover:bg-white active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Đang thử lại..." : "Tải lại trang"}
          </button>
        </div>

        <p className="text-xs text-zinc-500 font-mono">
          Locketwan Admin PWA &bull; Offline Mode
        </p>
      </div>
    </div>
  );
}
