import Link from "next/link";

interface EmptyStateProps {
  title: string;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({ title, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <div className="border-2 border-border bg-surface-raised p-8 md:p-12">
      <div className="font-display text-3xl md:text-5xl font-bold text-ink leading-tight mb-4">
        {title}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold tracking-widest uppercase bg-brand text-surface hover:bg-brand-dim active:translate-y-[1px] transition-all duration-normal"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
