import { cn } from "@/lib/cn";
import { Badge } from "./badge";
import { bountyStatus, type BountyStatus } from "@/lib/tokens";

interface BountyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  status: BountyStatus;
  title: string;
  reward: string;
  deadline: string;
  description?: string;
  proposer?: string;
}

export function BountyCard({
  status,
  title,
  reward,
  deadline,
  description,
  proposer,
  className,
  ...props
}: BountyCardProps) {
  const statusConfig = bountyStatus[status];

  return (
    <div
      className={cn(
        "border bg-surface-raised p-4 transition-all duration-fast ease-out-quart",
        "hover:border-border-strong active:scale-[0.995]",
        statusConfig.borderColor,
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink font-display uppercase tracking-wider leading-tight">
          {title}
        </h3>
        <Badge variant={status === "Expired" ? "default" : status === "Open" ? "success" : status === "Claimed" ? "warning" : "success"}>
          {statusConfig.label}
        </Badge>
      </div>

      {description && (
        <p className="mt-2 text-sm text-ink-muted font-body line-clamp-2">
          {description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-faint font-display text-xs uppercase tracking-wider">
            Reward
          </span>
          <span className="font-mono font-medium text-brand tabular-nums">{reward}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-ink-faint font-display text-xs uppercase tracking-wider">
            Deadline
          </span>
          <span className={cn("font-mono", status === "Expired" ? "text-ink-muted line-through" : "text-ink")}>
            {deadline}
          </span>
        </div>
      </div>

      {proposer && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-xs text-ink-faint font-display uppercase tracking-wider">
            Proposer{" "}
          </span>
          <span className="font-mono text-xs text-ink-muted">
            {proposer.slice(0, 6)}...{proposer.slice(-4)}
          </span>
        </div>
      )}
    </div>
  );
}
