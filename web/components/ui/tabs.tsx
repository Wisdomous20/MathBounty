"use client";

import { cn } from "@/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface TabItem {
  label: string;
  href: string;
  count?: number;
}

interface TabsProps {
  items: TabItem[];
  className?: string;
}

export function Tabs({ items, className }: TabsProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex border-b-2 border-border", className)}>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-6 py-4 font-display text-sm font-bold uppercase tracking-widest transition-colors duration-fast",
              isActive 
                ? "text-brand" 
                : "text-ink-muted hover:text-ink hover:bg-surface-raised"
            )}
          >
            <div className="flex items-center gap-2">
              {item.label}
              {typeof item.count === "number" && (
                <span className={cn(
                  "flex h-5 min-w-5 items-center justify-center px-1 font-mono text-[10px] tabular-nums transition-colors",
                  isActive ? "bg-brand text-surface" : "bg-surface-sunken text-ink-faint"
                )}>
                  {item.count}
                </span>
              )}
            </div>
            {isActive && (
              <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
