import type { ElementType } from 'react';
import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  as?: ElementType;
}

export function Skeleton({ className, as: Tag = 'span' }: SkeletonProps) {
  return (
    <Tag
      aria-hidden
      className={cn('block bg-bg-sunken animate-skeleton-pulse', className)}
    />
  );
}
