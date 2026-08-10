import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type PillVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info';
type PillSize = 'sm' | 'base';

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
  size?: PillSize;
  className?: string;
}

const variantClass: Record<PillVariant, string> = {
  neutral: 'bg-bg-sunken text-text-secondary border-border-hairline',
  success: 'bg-status-success-bg text-status-success border-status-success/20',
  warning: 'bg-status-warning-bg text-status-warning border-status-warning/20',
  error: 'bg-status-error-bg text-status-error border-status-error/20',
  info: 'bg-status-info-bg text-status-info border-status-info/20',
};

const sizeClass: Record<PillSize, string> = {
  sm: 'text-[10px] tracking-[0.12em] px-2 py-[3px]',
  base: 'text-[11px] tracking-[0.14em] px-2.5 py-1',
};

export function Pill({
  children,
  variant = 'neutral',
  size = 'base',
  className,
}: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border font-medium uppercase',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
