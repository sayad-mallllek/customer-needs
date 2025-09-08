import { useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-h-[90vh] overflow-auto rounded-md bg-white shadow-xl border animate-[fadeIn_.2s_ease]",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl"
        )}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between gap-4">
          <h2 className="font-semibold text-sm">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800 text-xs"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4 text-sm">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t bg-neutral-50 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
