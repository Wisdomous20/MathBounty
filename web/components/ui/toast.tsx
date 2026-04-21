"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastProps {
  variant?: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
  onDismiss?: () => void;
  visible?: boolean;
}

export function Toast({
  variant = "info",
  title,
  description,
  duration = 5000,
  onDismiss,
  visible = true,
}: ToastProps) {
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (!visible || !duration || dismissedRef.current) return;

    const timer = setTimeout(() => {
      dismissedRef.current = true;
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  useEffect(() => {
    if (visible) {
      dismissedRef.current = false;
    }
  }, [visible]);

  const variantClasses = {
    success: "border-success text-success",
    error: "border-error text-error",
    info: "border-brand text-brand",
    warning: "border-brand-dim text-brand",
  };

  const iconMap = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 border bg-surface-raised p-4 shadow-md animate-slide-in-right",
        variantClasses[variant]
      )}
      role="alert"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-current text-xs font-bold">
        {iconMap[variant]}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-ink font-display uppercase tracking-wider">{title}</h4>
        {description && (
          <p className="mt-0.5 text-sm text-ink-muted font-body">{description}</p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={() => {
            dismissedRef.current = true;
            onDismiss();
          }}
          className="shrink-0 text-ink-faint hover:text-ink transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
