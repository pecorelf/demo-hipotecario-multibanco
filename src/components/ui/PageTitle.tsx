import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PageTitleSize = 'display-xl' | 'display-lg' | 'h1';

interface PageTitleProps {
  children: ReactNode;
  size?: PageTitleSize;
  className?: string;
}

const sizeClass: Record<PageTitleSize, string> = {
  'display-xl': 'text-display-xl',
  'display-lg': 'text-display-lg',
  'h1': 'text-h1',
};

export function PageTitle({ children, size = 'h1', className }: PageTitleProps) {
  return (
    <h1 className={cn(sizeClass[size], 'text-text-primary font-sans', className)}>
      {children}
    </h1>
  );
}
