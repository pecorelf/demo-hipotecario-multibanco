import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SectionTitleProps {
  children: ReactNode;
  rule?: boolean;
  as?: ElementType;
  className?: string;
}

export function SectionTitle({
  children,
  rule = true,
  as: Tag = 'h2',
  className,
}: SectionTitleProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {rule && <span aria-hidden className="block w-8 h-[2px] bg-accent mb-4" />}
      <Tag className="text-h2 text-text-primary">{children}</Tag>
    </div>
  );
}
