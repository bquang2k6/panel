"use client";

import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl shadow-lg border backdrop-blur transition-all duration-300 ${
            t.variant === "destructive"
              ? "bg-red-950/90 text-red-100 border-red-800"
              : t.variant === "success"
              ? "bg-emerald-950/90 text-emerald-100 border-emerald-800"
              : "bg-slate-900/95 text-slate-100 border-slate-800"
          }`}
        >
          <div className="flex items-start gap-3">
            {t.variant === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : t.variant === "destructive" ? (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 text-xs">
              {t.title && <p className="font-semibold text-sm">{t.title}</p>}
              {t.description && <p className="opacity-90">{t.description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="opacity-70 hover:opacity-100 shrink-0 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
