import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info";
}

interface ToastCtx {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (t: Omit<Toast, "id">) => {
    const toast: Toast = { id: crypto.randomUUID(), ...t };
    setToasts((ts) => [...ts, toast]);
    setTimeout(() => dismiss(toast.id), 4200);
  };
  const dismiss = (id: string) =>
    setToasts((ts) => ts.filter((t) => t.id !== id));
  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <div className="fixed inset-x-0 bottom-2 z-50 flex flex-col items-center gap-2 px-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "w-full max-w-sm rounded-md shadow border bg-white p-3 text-sm flex items-start gap-3 animate-[fadeIn_.25s_ease]",
              t.variant === "success" && "border-green-300",
              t.variant === "error" && "border-red-300"
            )}
          >
            <div className="flex-1">
              <p className="font-medium">{t.title}</p>
              {t.description && (
                <p className="text-neutral-600 text-xs mt-0.5">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}

// minimal fadeIn keyframes (added via global css if not already)
