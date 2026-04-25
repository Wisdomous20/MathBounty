import { cn } from "@/lib/cn";

export type WalletState = "disconnected" | "connecting" | "connected" | "wrong-network";

interface WalletConnectStateProps {
  state: WalletState;
  address?: string;
  networkName?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSwitchNetwork?: () => void;
}

export function WalletConnectState({
  state,
  address,
  networkName = "Sepolia",
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}: WalletConnectStateProps) {
  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (state === "connecting") {
    return (
      <div
        className={cn(
          "inline-flex h-10 items-center gap-2 border border-border bg-surface-raised px-4",
          "text-sm font-medium text-ink-muted font-display uppercase tracking-wider"
        )}
      >
        <span className="h-4 w-4 animate-spin border-2 border-ink-muted border-t-transparent" />
        Connecting...
      </div>
    );
  }

  if (state === "disconnected") {
    return (
      <button
        onClick={onConnect}
        className={cn(
          "inline-flex h-10 items-center gap-2 border border-border bg-surface-raised px-4",
          "text-sm font-medium text-ink font-display uppercase tracking-wider",
          "transition-all duration-fast ease-out-quart",
          "hover:border-brand hover:text-brand",
          "focus-visible:outline-[3px] focus-visible:outline-brand focus-visible:outline-offset-[3px]"
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
          "focus-visible:outline-[3px] focus-visible:outline-error focus-visible:outline-offset-[3px]"
        )}
      >
        <span className="h-2 w-2 bg-error animate-pulse" />
        Wrong Network
        <span className="text-xs opacity-75">(Switch to {networkName})</span>
      </button>
    );
  }

  // Connected — brutalist disconnect button
  return (
    <button
      onClick={onDisconnect}
      className={cn(
        "group inline-flex h-10 items-center gap-2 border border-border bg-surface-raised px-4",
        "text-sm font-medium text-ink font-display uppercase tracking-wider",
        "transition-all duration-fast ease-out-quart",
        "hover:border-brand hover:text-brand hover:bg-surface-sunken",
        "focus-visible:outline-[3px] focus-visible:outline-brand focus-visible:outline-offset-[3px]"
        )}
      title="Click to disconnect"
    >
      <span className="h-2 w-2 bg-success group-hover:bg-error transition-colors duration-fast" />
      <span className="font-mono text-xs group-hover:hidden">
        {address ? truncateAddress(address) : "Connected"}
      </span>
      <span className="font-mono text-xs hidden group-hover:inline">
        Disconnect
      </span>
    </button>
  );
}
