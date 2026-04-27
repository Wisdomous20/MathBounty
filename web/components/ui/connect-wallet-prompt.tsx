"use client";

import { useWallet } from "@/lib/use-wallet";
import { Button } from "./button";
import { cn } from "@/lib/cn";

interface ConnectWalletPromptProps {
  title: string;
  description: string;
  className?: string;
}

export function ConnectWalletPrompt({
  title,
  description,
  className,
}: ConnectWalletPromptProps) {
  const { connect } = useWallet();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border bg-surface-raised",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center bg-surface-sunken border-2 border-border">
        <svg
          className="h-8 w-8 text-ink-faint"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      </div>
      <h3 className="mb-2 font-display text-xl font-bold uppercase tracking-tight text-ink">
        {title}
      </h3>
      <p className="mb-8 max-w-sm text-sm text-ink-muted">
        {description}
      </p>
      <Button onClick={() => void connect()}>
        Connect Wallet
      </Button>
    </div>
  );
}
