import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'base' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-text-inverse hover:bg-accent-muted active:bg-accent-muted',
  secondary:
    'bg-transparent text-text-primary border border-border-hairline hover:border-text-primary hover:bg-bg-card',
  ghost:
    'bg-transparent text-accent-muted hover:text-accent hover:underline underline-offset-4',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'text-body-sm px-3 py-2',
  base: 'text-body px-5 py-2.5',
  lg: 'text-body-lg px-7 py-3.5',
};

export function Button({
  children,
  variant = 'primary',
  size = 'base',
  type = 'button',
  disabled,
  iconLeft,
  iconRight,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-base ease-out-soft',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {iconLeft && <span className="shrink-0">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
