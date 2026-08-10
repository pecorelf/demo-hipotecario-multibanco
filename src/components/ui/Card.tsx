import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type CardPadding = 'none' | 'sm' | 'base' | 'lg' | 'xl';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  padding?: CardPadding;
  as?: ElementType;
}

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm: 'p-6',
  base: 'p-8',
  lg: 'p-10',
  xl: 'p-12',
};

export function Card({
  children,
  elevated = false,
  interactive = false,
  padding = 'base',
  as: Tag = 'div',
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'bg-bg-card border border-border-hairline',
        paddingClass[padding],
        elevated && 'shadow-soft',
        interactive &&
          'transition-all duration-base ease-out-soft hover:-translate-y-px hover:shadow-soft-hover cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
