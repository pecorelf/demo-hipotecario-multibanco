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
        // Toda tarjeta se despega del fondo. `elevated` sube un escalón más,
        // para lo que debe destacar por sobre el resto de la página.
        'rounded-xl bg-bg-card border border-border-hairline shadow-soft',
        paddingClass[padding],
        elevated && 'shadow-[var(--shadow-alto)]',
        interactive &&
          'transition-all duration-base ease-out-soft hover:-translate-y-0.5 hover:shadow-soft-hover cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
