"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { XIcon, Info, CheckCircle2, AlertTriangle } from "lucide-react";

export type ToastVariant = "default" | "success" | "warning" | "destructive";

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = uid();
      const duration = t.duration ?? 3500;
      const toast: Toast = { id, ...t };
      setToasts((prev) => [...prev, toast]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[70] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function IconForVariant({ variant }: { variant: ToastVariant | undefined }) {
  switch (variant) {
    case "success":
      return <CheckCircle2 className="text-green-500" />;
    case "warning":
      return <AlertTriangle className="text-yellow-500" />;
    case "destructive":
      return <AlertTriangle className="text-destructive" />;
    default:
      return <Info className="text-foreground" />;
  }
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card/95 backdrop-blur p-3 text-sm shadow-lg",
        "flex items-start gap-3",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5 flex-shrink-0"> <IconForVariant variant={toast.variant} /> </div>
      <div className="min-w-0 flex-1">
        {toast.title && <div className="font-medium leading-tight">{toast.title}</div>}
        {toast.description && (
          <div className="text-muted-foreground leading-snug">{toast.description}</div>
        )}
      </div>
      <button
        className="ml-2 inline-flex size-6 items-center justify-center rounded-md hover:bg-accent"
        onClick={onClose}
        aria-label="Dismiss"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
