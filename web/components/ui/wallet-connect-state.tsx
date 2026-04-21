import { cn } from "@/lib/cn";

export type WalletState = "disconnected" | "connected" | "wrong-network";

interface WalletConnectStateProps {
  state: WalletState;
  address?: string;
  networkName?: string;
  onConnect?: () => void;
  onSwitchNetwork?: () => void;
}

export function WalletConnectState({
  state,
  address,
  networkName = "Sepolia",
  onConnect,
  onSwitchNetwork,
}: WalletConnectStateProps) {
  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (state === "disconnected") {
    return (
      <button
        onClick={onConnect}
        className={cn(
          "inline-flex h-10 items-center gap-2 border border-border bg-surface-raised px-4",
          "text-sm font-medium text-ink font-display uppercase tracking-wider",
          "transition-all duration-fast ease-out-quart",
          "hover:border-brand hover:text-brand",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        )}
      >
        <span className="h-2 w-2 bg-ink-faint" />
        Connect Wallet
      </button>
    );
  }

  if (state === "wrong-network") {
    return (
      <button
        onClick={onSwitchNetwork}
        className={cn(
          "inline-flex h-10 items-center gap-2 border border-error bg-error-dim px-4",
          "text-sm font-medium text-error font-display uppercase tracking-wider",
          "transition-all duration-fast ease-out-quart",
          "hover:bg-error hover:text-surface",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        )}
      >
        <span className="h-2 w-2 bg-error animate-pulse" />
        Wrong Network
        <span className="text-xs opacity-75">(Switch to {networkName})</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center gap-2 border border-success bg-success-dim px-4",
        "text-sm font-medium text-success font-display uppercase tracking-wider"
      )}
    >
      <span className="h-2 w-2 bg-success" />
      <span className="font-mono text-xs">
        {address ? truncateAddress(address) : "Connected"}
      </span>
    </div>
  );
}
