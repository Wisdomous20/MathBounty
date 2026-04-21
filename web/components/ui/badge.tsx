import { cn } from '@/lib/cn'

export type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'brand'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

export function Badge ({
  variant = 'default',
  size = 'sm',
  children,
  className,
  ...props
}: BadgeProps) {
  const base =
    'inline-flex items-center justify-center font-display font-medium uppercase tracking-wider'

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  }

  const variantClasses = {
    default: 'bg-surface-sunken text-ink-muted border border-border',
    success: 'bg-success-dim text-success border border-success/30',
    error: 'bg-error-dim text-error border border-error/30',
    warning: 'bg-brand-dim text-brand border border-brand/30',
    brand: 'bg-brand text-surface border border-brand'
  }

  return (
    <span
      className={cn(
        base,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
