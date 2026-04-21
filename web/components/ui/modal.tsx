"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-surface-sunken/90"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full max-w-lg border-2 border-border bg-surface-raised shadow-lg",
          "animate-fade-in animate-zoom-in-95"
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="border-b border-border p-4">
            {title && (
              <h2 className="text-lg font-semibold text-ink font-display uppercase tracking-wider">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-ink-muted font-body">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-border p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
