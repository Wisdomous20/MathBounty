import { cn } from "@/lib/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-ink-muted font-display uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "w-full border bg-surface-raised px-3 py-2.5 text-base text-ink placeholder:text-ink-faint font-body transition-all duration-fast ease-out-quart resize-none",
          error
            ? "border-error focus-visible:border-brand"
            : "border-border hover:border-border-strong focus-visible:border-brand",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-sm text-error font-body">{error}</span>
      )}
    </div>
  );
}
