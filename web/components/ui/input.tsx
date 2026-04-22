import { cn } from "@/lib/cn";

export type InputState = "default" | "error" | "disabled";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  state?: InputState;
}

export function Input({
  label,
  error,
  state = "default",
  disabled,
  className,
  id,
  ...props
}: InputProps) {
  const isError = state === "error" || !!error;
  const isDisabled = state === "disabled" || disabled;

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
      <input
        id={id}
        disabled={isDisabled}
        className={cn(
          "h-10 w-full border bg-surface-raised px-3 text-base text-ink placeholder:text-ink-faint font-body transition-all duration-fast ease-out-quart",
          isError
            ? "border-error focus-visible:border-brand"
            : "border-border hover:border-border-strong focus-visible:border-brand",
          isDisabled && "opacity-50 cursor-not-allowed bg-surface-sunken",
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
